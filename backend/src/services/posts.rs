use sqlx::PgPool;
use redis::aio::ConnectionManager;
use uuid::Uuid;
use std::sync::Arc;
use crate::api::posts::CreatePostRequest;
use crate::errors::{AppError, Result};
use crate::utils::Pagination;
use crate::websocket::WsState;

pub async fn get_feed(db: &PgPool, _redis: &ConnectionManager, _user_id: Option<Uuid>, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, String, serde_json::Value, Vec<String>, i32, i32, i32, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.media_urls, p.hashtags,
                p.likes_count, p.comments_count, p.shares_count, p.created_at,
                u.id, u.username, u.full_name, u.avatar_url, u.headline
         FROM posts p JOIN users u ON u.id = p.author_id
         WHERE p.visibility='public' ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
    ).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "media_urls": r.3, "hashtags": r.4,
        "likes_count": r.5, "comments_count": r.6, "shares_count": r.7, "created_at": r.8,
        "liked": false, "saved": false,
        "author": { "id": r.9, "username": r.10, "full_name": r.11, "avatar_url": r.12, "headline": r.13 }
    })).collect())
}

pub async fn create_post(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, req: CreatePostRequest) -> Result<serde_json::Value> {
    if req.content.trim().is_empty() && req.media_urls.as_ref().map_or(true, |v| v.is_empty()) {
        return Err(AppError::BadRequest("Post cannot be empty".into()));
    }
    let post_id = Uuid::new_v4();
    let media_urls = serde_json::to_value(&req.media_urls.unwrap_or_default()).unwrap();
    let hashtags: Vec<String> = req.hashtags.unwrap_or_default();
    let mentions = serde_json::to_value(&req.mentions.clone().unwrap_or_default()).unwrap();
    let post_type = req.post_type.unwrap_or_else(|| "text".into());
    let visibility = req.visibility.unwrap_or_else(|| "public".into());

    sqlx::query(
        "INSERT INTO posts (id, author_id, content, post_type, media_urls, hashtags, mentions, visibility)
         VALUES ($1,$2,$3,$4::post_type,$5,$6,$7,$8::post_visibility)"
    )
    .bind(post_id).bind(user_id).bind(&req.content)
    .bind(&post_type).bind(&media_urls).bind(&hashtags).bind(&mentions).bind(&visibility)
    .execute(db).await?;

    sqlx::query("UPDATE users SET posts_count = posts_count + 1 WHERE id=$1").bind(user_id).execute(db).await?;

    if let Some(mention_ids) = &req.mentions {
        for mid in mention_ids {
            super::notifications::create_notification(db, ws_state, crate::models::NotificationType::Mention,
                *mid, Some(user_id), Some(post_id), Some("post".into())).await.ok();
        }
    }

    get_post(db, post_id, Some(user_id)).await
}

pub async fn get_post(db: &PgPool, post_id: Uuid, viewer_id: Option<Uuid>) -> Result<serde_json::Value> {
    // Split into two queries to avoid >16 tuple limit
    let row = sqlx::query_as::<_, (Uuid, String, String, serde_json::Value, Vec<String>, i32, i32, i32, i32, String, bool, chrono::DateTime<chrono::Utc>)>(
        "SELECT p.id, p.content, p.post_type::text, p.media_urls, p.hashtags,
                p.likes_count, p.comments_count, p.shares_count, p.saves_count, p.visibility::text,
                p.is_pinned, p.created_at
         FROM posts p WHERE p.id=$1"
    ).bind(post_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Post".into()))?;
    let author = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, u.headline FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=$1"
    ).bind(post_id).fetch_one(db).await?;

    let liked = if let Some(vid) = viewer_id {
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2)")
            .bind(post_id).bind(vid).fetch_one(db).await.unwrap_or(false)
    } else { false };

    Ok(serde_json::json!({
        "id": row.0, "content": row.1, "post_type": row.2, "media_urls": row.3, "hashtags": row.4,
        "likes_count": row.5, "comments_count": row.6, "shares_count": row.7, "saves_count": row.8,
        "visibility": row.9, "is_pinned": row.10, "liked": liked, "saved": false, "created_at": row.11,
        "author": { "id": author.0, "username": author.1, "full_name": author.2, "avatar_url": author.3, "headline": author.4 }
    }))
}

pub async fn update_post(db: &PgPool, user_id: Uuid, post_id: Uuid, req: CreatePostRequest) -> Result<serde_json::Value> {
    let rows = sqlx::query("UPDATE posts SET content=$1, updated_at=NOW() WHERE id=$2 AND author_id=$3")
        .bind(&req.content).bind(post_id).bind(user_id).execute(db).await?.rows_affected();
    if rows == 0 { return Err(AppError::Forbidden); }
    get_post(db, post_id, Some(user_id)).await
}

pub async fn delete_post(db: &PgPool, user_id: Uuid, post_id: Uuid) -> Result<()> {
    let rows = sqlx::query("DELETE FROM posts WHERE id=$1 AND author_id=$2")
        .bind(post_id).bind(user_id).execute(db).await?.rows_affected();
    if rows == 0 { return Err(AppError::Forbidden); }
    sqlx::query("UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id=$1").bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn like_post(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, post_id: Uuid) -> Result<i32> {
    sqlx::query("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(post_id).bind(user_id).execute(db).await?;
    let count: i32 = sqlx::query_scalar("UPDATE posts SET likes_count=likes_count+1 WHERE id=$1 RETURNING likes_count")
        .bind(post_id).fetch_one(db).await?;
    let author_id: Option<Uuid> = sqlx::query_scalar("SELECT author_id FROM posts WHERE id=$1")
        .bind(post_id).fetch_optional(db).await?;
    if let Some(aid) = author_id {
        if aid != user_id {
            super::notifications::create_notification(db, ws_state, crate::models::NotificationType::Like,
                aid, Some(user_id), Some(post_id), Some("post".into())).await.ok();
        }
    }
    Ok(count)
}

pub async fn unlike_post(db: &PgPool, user_id: Uuid, post_id: Uuid) -> Result<i32> {
    sqlx::query("DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2").bind(post_id).bind(user_id).execute(db).await?;
    let count: i32 = sqlx::query_scalar("UPDATE posts SET likes_count=GREATEST(likes_count-1,0) WHERE id=$1 RETURNING likes_count")
        .bind(post_id).fetch_one(db).await?;
    Ok(count)
}

pub async fn save_post(db: &PgPool, user_id: Uuid, post_id: Uuid) -> Result<()> {
    sqlx::query("INSERT INTO post_saves (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(post_id).bind(user_id).execute(db).await?;
    sqlx::query("UPDATE posts SET saves_count=saves_count+1 WHERE id=$1").bind(post_id).execute(db).await?;
    Ok(())
}

pub async fn unsave_post(db: &PgPool, user_id: Uuid, post_id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM post_saves WHERE post_id=$1 AND user_id=$2").bind(post_id).bind(user_id).execute(db).await?;
    sqlx::query("UPDATE posts SET saves_count=GREATEST(saves_count-1,0) WHERE id=$1").bind(post_id).execute(db).await?;
    Ok(())
}

pub async fn share_post(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, original_id: Uuid) -> Result<serde_json::Value> {
    let original = get_post(db, original_id, Some(user_id)).await?;
    let content = original["content"].as_str().unwrap_or("").to_string();
    sqlx::query("UPDATE posts SET shares_count=shares_count+1 WHERE id=$1").bind(original_id).execute(db).await?;
    let req = CreatePostRequest { content, post_type: Some("text".into()), media_urls: None, hashtags: None, mentions: None, visibility: Some("public".into()) };
    create_post(db, ws_state, user_id, req).await
}

pub async fn get_trending(db: &PgPool, _redis: &ConnectionManager) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, i32, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.likes_count, p.comments_count, p.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM posts p JOIN users u ON u.id=p.author_id WHERE p.visibility='public'
         AND p.created_at > NOW() - INTERVAL '7 days'
         ORDER BY (p.likes_count + p.comments_count * 2 + p.shares_count * 3) DESC LIMIT 20"
    ).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "likes_count": r.3, "comments_count": r.4, "created_at": r.5,
        "author": { "id": r.6, "username": r.7, "full_name": r.8, "avatar_url": r.9 }
    })).collect())
}

pub async fn get_by_hashtag(db: &PgPool, tag: &str, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, i32, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.likes_count, p.comments_count, p.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM posts p JOIN users u ON u.id=p.author_id
         WHERE $1 = ANY(p.hashtags) AND p.visibility='public'
         ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(tag).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "likes_count": r.3, "comments_count": r.4, "created_at": r.5,
        "author": { "id": r.6, "username": r.7, "full_name": r.8, "avatar_url": r.9 }
    })).collect())
}

pub async fn get_comments(db: &PgPool, post_id: Uuid, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, i32, i32, Option<Uuid>, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT c.id, c.content, c.likes_count, c.replies_count, c.parent_id, c.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM comments c JOIN users u ON u.id=c.author_id
         WHERE c.post_id=$1 AND c.parent_id IS NULL
         ORDER BY c.created_at ASC LIMIT $2 OFFSET $3"
    ).bind(post_id).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "likes_count": r.2, "replies_count": r.3, "parent_id": r.4, "created_at": r.5,
        "author": { "id": r.6, "username": r.7, "full_name": r.8, "avatar_url": r.9 }
    })).collect())
}

pub async fn add_comment(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, post_id: Uuid, content: String, parent_id: Option<Uuid>) -> Result<serde_json::Value> {
    let comment_id = Uuid::new_v4();
    sqlx::query("INSERT INTO comments (id, post_id, author_id, content, parent_id) VALUES ($1,$2,$3,$4,$5)")
        .bind(comment_id).bind(post_id).bind(user_id).bind(&content).bind(parent_id).execute(db).await?;
    sqlx::query("UPDATE posts SET comments_count=comments_count+1 WHERE id=$1").bind(post_id).execute(db).await?;
    if let Some(pid) = parent_id {
        sqlx::query("UPDATE comments SET replies_count=replies_count+1 WHERE id=$1").bind(pid).execute(db).await?;
    }
    let author_id: Option<Uuid> = sqlx::query_scalar("SELECT author_id FROM posts WHERE id=$1")
        .bind(post_id).fetch_optional(db).await?;
    if let Some(aid) = author_id {
        if aid != user_id {
            super::notifications::create_notification(db, ws_state, crate::models::NotificationType::Comment,
                aid, Some(user_id), Some(post_id), Some("post".into())).await.ok();
        }
    }
    let user_row = sqlx::query_as::<_, (String, String, Option<String>)>(
        "SELECT username, full_name, avatar_url FROM users WHERE id=$1"
    ).bind(user_id).fetch_one(db).await?;
    Ok(serde_json::json!({
        "id": comment_id, "content": content, "post_id": post_id,
        "parent_id": parent_id, "likes_count": 0, "replies_count": 0,
        "created_at": chrono::Utc::now(),
        "author": { "id": user_id, "username": user_row.0, "full_name": user_row.1, "avatar_url": user_row.2 }
    }))
}

pub async fn update_comment(db: &PgPool, user_id: Uuid, comment_id: Uuid, content: String) -> Result<serde_json::Value> {
    let rows = sqlx::query("UPDATE comments SET content=$1, updated_at=NOW() WHERE id=$2 AND author_id=$3")
        .bind(&content).bind(comment_id).bind(user_id).execute(db).await?.rows_affected();
    if rows == 0 { return Err(AppError::Forbidden); }
    Ok(serde_json::json!({ "id": comment_id, "content": content }))
}

pub async fn delete_comment(db: &PgPool, user_id: Uuid, comment_id: Uuid) -> Result<()> {
    let row = sqlx::query_as::<_, (Uuid, Option<Uuid>)>(
        "SELECT post_id, parent_id FROM comments WHERE id=$1 AND author_id=$2"
    ).bind(comment_id).bind(user_id).fetch_optional(db).await?.ok_or(AppError::Forbidden)?;
    sqlx::query("DELETE FROM comments WHERE id=$1").bind(comment_id).execute(db).await?;
    sqlx::query("UPDATE posts SET comments_count=GREATEST(comments_count-1,0) WHERE id=$1").bind(row.0).execute(db).await?;
    if let Some(pid) = row.1 {
        sqlx::query("UPDATE comments SET replies_count=GREATEST(replies_count-1,0) WHERE id=$1").bind(pid).execute(db).await?;
    }
    Ok(())
}

pub async fn like_comment(db: &PgPool, user_id: Uuid, comment_id: Uuid) -> Result<i32> {
    sqlx::query("INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(comment_id).bind(user_id).execute(db).await?;
    let count: i32 = sqlx::query_scalar("UPDATE comments SET likes_count=likes_count+1 WHERE id=$1 RETURNING likes_count")
        .bind(comment_id).fetch_one(db).await?;
    Ok(count)
}

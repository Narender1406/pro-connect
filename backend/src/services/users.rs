use sqlx::PgPool;
use redis::aio::ConnectionManager;
use uuid::Uuid;
use axum::extract::Multipart;
use crate::api::users::UpdateProfileRequest;
use crate::config::AppConfig;
use crate::errors::{AppError, Result};
use crate::models::{User, UserProfile};
use crate::utils::Pagination;
use crate::websocket::WsState;
use std::sync::Arc;

pub async fn get_profile(db: &PgPool, user_id: Uuid, viewer_id: Option<Uuid>) -> Result<serde_json::Value> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id=$1 AND status='active'")
        .bind(user_id).fetch_optional(db).await?
        .ok_or_else(|| AppError::NotFound("User".into()))?;

    let profile = sqlx::query_as::<_, UserProfile>("SELECT * FROM user_profiles WHERE user_id=$1")
        .bind(user_id).fetch_optional(db).await?;

    let is_following = if let Some(vid) = viewer_id {
        sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2)"
        ).bind(vid).bind(user_id).fetch_one(db).await.unwrap_or(false)
    } else { false };

    if viewer_id.is_some() && viewer_id != Some(user_id) {
        sqlx::query(
            "INSERT INTO profile_views (viewer_id, profile_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
        ).bind(viewer_id).bind(user_id).execute(db).await.ok();
        sqlx::query("UPDATE user_profiles SET profile_views = profile_views + 1 WHERE user_id=$1")
            .bind(user_id).execute(db).await.ok();
    }

    Ok(serde_json::json!({
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "headline": user.headline,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "cover_url": user.cover_url,
        "location": user.location,
        "website": user.website,
        "github_username": user.github_username,
        "linkedin_url": user.linkedin_url,
        "resume_url": user.resume_url,
        "open_to_work": user.open_to_work,
        "followers_count": user.followers_count,
        "following_count": user.following_count,
        "posts_count": user.posts_count,
        "is_following": is_following,
        "skills": profile.as_ref().map(|p| &p.skills),
        "experience": profile.as_ref().map(|p| &p.experience),
        "education": profile.as_ref().map(|p| &p.education),
        "portfolio_links": profile.as_ref().map(|p| &p.portfolio_links),
        "profile_views": profile.as_ref().map(|p| p.profile_views),
        "created_at": user.created_at,
    }))
}

pub async fn update_profile(db: &PgPool, user_id: Uuid, req: UpdateProfileRequest) -> Result<serde_json::Value> {
    sqlx::query(
        "UPDATE users SET full_name=COALESCE($1, full_name), headline=$2, bio=$3, location=$4,
         website=$5, github_username=$6, linkedin_url=$7, open_to_work=$8, updated_at=NOW() WHERE id=$9"
    )
    .bind(&req.full_name).bind(&req.headline).bind(&req.bio)
    .bind(&req.location).bind(&req.website).bind(&req.github_username)
    .bind(&req.linkedin_url).bind(req.open_to_work.unwrap_or(false))
    .bind(user_id).execute(db).await?;

    if req.skills.is_some() || req.experience.is_some() || req.education.is_some() || req.portfolio_links.is_some() {
        let skills = serde_json::to_value(&req.skills).unwrap_or(serde_json::json!([]));
        let experience = serde_json::to_value(&req.experience).unwrap_or(serde_json::json!([]));
        let education = serde_json::to_value(&req.education).unwrap_or(serde_json::json!([]));
        let portfolio = serde_json::to_value(&req.portfolio_links).unwrap_or(serde_json::json!([]));
        sqlx::query(
            "UPDATE user_profiles SET skills=$1, experience=$2, education=$3, portfolio_links=$4, updated_at=NOW() WHERE user_id=$5"
        ).bind(skills).bind(experience).bind(education).bind(portfolio).bind(user_id).execute(db).await?;
    }

    get_profile(db, user_id, Some(user_id)).await
}

pub async fn upload_avatar(db: &PgPool, config: &AppConfig, user_id: Uuid, mut multipart: Multipart) -> Result<String> {
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let content_type = field.content_type().unwrap_or("image/jpeg").to_string();
            if !content_type.starts_with("image/") {
                return Err(AppError::BadRequest("Only images allowed".into()));
            }
            let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            if data.len() > (config.max_file_size_mb * 1024 * 1024) as usize {
                return Err(AppError::BadRequest(format!("File too large. Max {}MB", config.max_file_size_mb)));
            }
            let key = format!("avatars/{}/{}.jpg", user_id, Uuid::new_v4());
            let url = format!("https://{}.s3.{}.amazonaws.com/{}", config.s3_bucket, config.s3_region, key);
            sqlx::query("UPDATE users SET avatar_url=$1 WHERE id=$2").bind(&url).bind(user_id).execute(db).await?;
            return Ok(url);
        }
    }
    Err(AppError::BadRequest("No file provided".into()))
}

pub async fn upload_cover(db: &PgPool, config: &AppConfig, user_id: Uuid, mut multipart: Multipart) -> Result<String> {
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            let key = format!("covers/{}/{}.jpg", user_id, Uuid::new_v4());
            let url = format!("https://{}.s3.{}.amazonaws.com/{}", config.s3_bucket, config.s3_region, key);
            sqlx::query("UPDATE users SET cover_url=$1 WHERE id=$2").bind(&url).bind(user_id).execute(db).await?;
            return Ok(url);
        }
    }
    Err(AppError::BadRequest("No file provided".into()))
}

pub async fn upload_resume(db: &PgPool, config: &AppConfig, user_id: Uuid, mut multipart: Multipart) -> Result<String> {
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            let key = format!("resumes/{}/{}.pdf", user_id, Uuid::new_v4());
            let url = format!("https://{}.s3.{}.amazonaws.com/{}", config.s3_bucket, config.s3_region, key);
            sqlx::query("UPDATE users SET resume_url=$1 WHERE id=$2").bind(&url).bind(user_id).execute(db).await?;
            return Ok(url);
        }
    }
    Err(AppError::BadRequest("No file provided".into()))
}

pub async fn follow_user(db: &PgPool, ws_state: &Arc<WsState>, follower_id: Uuid, following_id: Uuid) -> Result<()> {
    if follower_id == following_id { return Err(AppError::BadRequest("Cannot follow yourself".into())); }
    sqlx::query("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(follower_id).bind(following_id).execute(db).await?;
    sqlx::query("UPDATE users SET following_count = following_count + 1 WHERE id=$1").bind(follower_id).execute(db).await?;
    sqlx::query("UPDATE users SET followers_count = followers_count + 1 WHERE id=$1").bind(following_id).execute(db).await?;
    super::notifications::create_notification(db, ws_state, crate::models::NotificationType::Follow,
        following_id, Some(follower_id), None, None).await.ok();
    Ok(())
}

pub async fn unfollow_user(db: &PgPool, follower_id: Uuid, following_id: Uuid) -> Result<()> {
    let deleted = sqlx::query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2")
        .bind(follower_id).bind(following_id).execute(db).await?.rows_affected();
    if deleted > 0 {
        sqlx::query("UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id=$1").bind(follower_id).execute(db).await?;
        sqlx::query("UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id=$1").bind(following_id).execute(db).await?;
    }
    Ok(())
}

pub async fn get_followers(db: &PgPool, user_id: Uuid, page: i64, limit: i64) -> Result<serde_json::Value> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, u.headline
         FROM follows f JOIN users u ON u.id = f.follower_id
         WHERE f.following_id=$1 ORDER BY f.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(user_id).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    let users: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4
    })).collect();
    Ok(serde_json::json!({ "users": users, "page": page }))
}

pub async fn get_following(db: &PgPool, user_id: Uuid, page: i64, limit: i64) -> Result<serde_json::Value> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, u.headline
         FROM follows f JOIN users u ON u.id = f.following_id
         WHERE f.follower_id=$1 ORDER BY f.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(user_id).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    let users: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4
    })).collect();
    Ok(serde_json::json!({ "users": users, "page": page }))
}

pub async fn search_users(db: &PgPool, _redis: &ConnectionManager, params: crate::api::users::SearchQuery) -> Result<serde_json::Value> {
    let q = params.q.unwrap_or_default();
    let p = Pagination::new(params.page.unwrap_or(1), params.limit.unwrap_or(20));
    let search = format!("%{}%", q);
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, Option<String>, bool, i32)>(
        "SELECT id, username, full_name, avatar_url, headline, location, open_to_work, followers_count
         FROM users WHERE status='active' AND (full_name ILIKE $1 OR username ILIKE $1 OR headline ILIKE $1)
         ORDER BY followers_count DESC LIMIT $2 OFFSET $3"
    ).bind(&search).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    let users: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3,
        "headline": r.4, "location": r.5, "open_to_work": r.6, "followers_count": r.7
    })).collect();
    Ok(serde_json::json!({ "users": users, "query": q, "page": params.page.unwrap_or(1) }))
}

pub async fn get_personalized_feed(db: &PgPool, _redis: &ConnectionManager, user_id: Uuid, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, String, serde_json::Value, Vec<String>, i32, i32, i32, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.media_urls, p.hashtags,
                p.likes_count, p.comments_count, p.shares_count, p.created_at,
                u.id, u.username, u.full_name, u.avatar_url, u.headline
         FROM posts p JOIN users u ON u.id = p.author_id
         WHERE p.author_id IN (SELECT following_id FROM follows WHERE follower_id=$1) OR p.author_id=$1
         ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(user_id).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "media_urls": r.3, "hashtags": r.4,
        "likes_count": r.5, "comments_count": r.6, "shares_count": r.7, "created_at": r.8,
        "liked": false, "saved": false,
        "author": { "id": r.9, "username": r.10, "full_name": r.11, "avatar_url": r.12, "headline": r.13 }
    })).collect())
}

pub async fn get_saved_posts(db: &PgPool, user_id: Uuid, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, i32, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.likes_count, p.comments_count, p.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM post_saves ps JOIN posts p ON p.id=ps.post_id JOIN users u ON u.id=p.author_id
         WHERE ps.user_id=$1 ORDER BY ps.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(user_id).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "likes_count": r.3, "comments_count": r.4, "created_at": r.5,
        "author": { "id": r.6, "username": r.7, "full_name": r.8, "avatar_url": r.9 }
    })).collect())
}

pub async fn get_profile_analytics(db: &PgPool, user_id: Uuid) -> Result<serde_json::Value> {
    let views: i32 = sqlx::query_scalar("SELECT COALESCE(profile_views, 0) FROM user_profiles WHERE user_id=$1")
        .bind(user_id).fetch_optional(db).await?.unwrap_or(0);
    let post_impressions: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(likes_count + comments_count + shares_count), 0) FROM posts WHERE author_id=$1"
    ).bind(user_id).fetch_one(db).await?;
    let followers: i32 = sqlx::query_scalar("SELECT followers_count FROM users WHERE id=$1")
        .bind(user_id).fetch_one(db).await?;
    Ok(serde_json::json!({ "profile_views": views, "post_impressions": post_impressions, "followers": followers }))
}

pub async fn get_trending_users(db: &PgPool, _redis: &ConnectionManager) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, i32)>(
        "SELECT id, username, full_name, avatar_url, headline, followers_count FROM users WHERE status='active' ORDER BY followers_count DESC LIMIT 10"
    ).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4, "followers_count": r.5
    })).collect())
}

pub async fn get_suggestions(db: &PgPool, user_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, i32)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, u.headline, u.followers_count
         FROM users u WHERE u.id != $1 AND u.status='active'
         AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id=$1)
         ORDER BY u.followers_count DESC LIMIT 5"
    ).bind(user_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4, "followers_count": r.5
    })).collect())
}

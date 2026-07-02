use axum::{Router, Json, extract::{State, Query}, routing::get};
use serde::Deserialize;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::OptionalAuth;
use crate::utils::Pagination;
use uuid::Uuid;
use chrono::DateTime;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(global_search))
        .route("/users", get(search_users))
        .route("/posts", get(search_posts))
        .route("/jobs", get(search_jobs))
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

async fn global_search(
    State(state): State<AppState>,
    OptionalAuth(_auth): OptionalAuth,
    Query(q): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let search = format!("%{}%", q.q);
    let users = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>)>(
        "SELECT id, username, full_name, avatar_url, headline FROM users
         WHERE status='active' AND (full_name ILIKE $1 OR username ILIKE $1) LIMIT 5"
    ).bind(&search).fetch_all(&state.db).await.unwrap_or_default();

    let posts = sqlx::query_as::<_, (Uuid, String, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.created_at, u.username, u.full_name, u.avatar_url
         FROM posts p JOIN users u ON u.id=p.author_id
         WHERE p.visibility='public' AND p.content ILIKE $1
         ORDER BY p.created_at DESC LIMIT 5"
    ).bind(&search).fetch_all(&state.db).await.unwrap_or_default();

    Ok(Json(serde_json::json!({
        "query": q.q,
        "users": users.iter().map(|u| serde_json::json!({
            "id": u.0, "username": u.1, "full_name": u.2, "avatar_url": u.3, "headline": u.4, "type": "user"
        })).collect::<Vec<_>>(),
        "posts": posts.iter().map(|p| serde_json::json!({
            "id": p.0, "content": &p.1[..p.1.len().min(150)], "created_at": p.2, "type": "post",
            "author": { "username": p.3, "full_name": p.4, "avatar_url": p.5 }
        })).collect::<Vec<_>>(),
    })))
}

async fn search_users(
    State(state): State<AppState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let p = Pagination::new(q.page.unwrap_or(1), q.limit.unwrap_or(20));
    let search = format!("%{}%", q.q);
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, Option<String>, i32, bool)>(
        "SELECT id, username, full_name, avatar_url, headline, location, followers_count, open_to_work
         FROM users WHERE status='active' AND (full_name ILIKE $1 OR username ILIKE $1 OR headline ILIKE $1)
         ORDER BY followers_count DESC LIMIT $2 OFFSET $3"
    ).bind(&search).bind(p.limit).bind(p.offset).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "users": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4,
        "location": r.5, "followers_count": r.6, "open_to_work": r.7
    })).collect::<Vec<_>>(), "query": q.q })))
}

async fn search_posts(
    State(state): State<AppState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let p = Pagination::new(q.page.unwrap_or(1), q.limit.unwrap_or(20));
    let search = format!("%{}%", q.q);
    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, i32, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.likes_count, p.comments_count, p.created_at,
                u.username, u.full_name, u.avatar_url
         FROM posts p JOIN users u ON u.id=p.author_id
         WHERE p.visibility='public' AND (p.content ILIKE $1 OR $1 = ANY(p.hashtags::text[]))
         ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(&search).bind(p.limit).bind(p.offset).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "posts": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "likes_count": r.3, "comments_count": r.4, "created_at": r.5,
        "author": { "username": r.6, "full_name": r.7, "avatar_url": r.8 }
    })).collect::<Vec<_>>(), "query": q.q })))
}

async fn search_jobs(
    State(state): State<AppState>,
    Query(q): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let p = Pagination::new(q.page.unwrap_or(1), q.limit.unwrap_or(20));
    let search = format!("%{}%", q.q);
    let rows = sqlx::query_as::<_, (Uuid, String, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.created_at, u.username, u.full_name, u.avatar_url
         FROM posts p JOIN users u ON u.id=p.author_id
         WHERE p.post_type='job_post' AND p.visibility='public' AND p.content ILIKE $1
         ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(&search).bind(p.limit).bind(p.offset).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "jobs": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "created_at": r.2,
        "author": { "username": r.3, "full_name": r.4, "avatar_url": r.5 }
    })).collect::<Vec<_>>() })))
}

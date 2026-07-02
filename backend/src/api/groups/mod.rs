use axum::{Router, Json, extract::{State, Path, Query}, routing::{get, post, put, delete}};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::DateTime;
use crate::api::AppState;
use crate::errors::{AppError, Result};
use crate::middleware::auth::AuthUser;
use crate::utils::Pagination;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_groups).post(create_group))
        .route("/:id", get(get_group).put(update_group).delete(delete_group))
        .route("/:id/join", post(join_group))
        .route("/:id/leave", post(leave_group))
        .route("/:id/members", get(get_members))
        .route("/:id/posts", get(get_group_posts).post(create_group_post))
}

#[derive(Deserialize, Serialize)]
pub struct CreateGroupRequest {
    pub name: String,
    pub description: Option<String>,
    pub is_private: Option<bool>,
    pub cover_url: Option<String>,
}

#[derive(Deserialize)]
pub struct GroupQuery {
    pub q: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

async fn list_groups(
    State(state): State<AppState>,
    Query(q): Query<GroupQuery>,
) -> Result<Json<serde_json::Value>> {
    let p = Pagination::new(q.page.unwrap_or(1), q.limit.unwrap_or(20));
    let search = format!("%{}%", q.q.unwrap_or_default());
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<String>, bool, i32, DateTime<chrono::Utc>, String, String)>(
        "SELECT g.id, g.name, g.description, g.cover_url, g.is_private, g.members_count, g.created_at,
                u.username, u.full_name
         FROM groups g JOIN users u ON u.id=g.owner_id
         WHERE g.is_private=false AND (g.name ILIKE $1 OR g.description ILIKE $1)
         ORDER BY g.members_count DESC LIMIT $2 OFFSET $3"
    ).bind(&search).bind(p.limit).bind(p.offset).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "groups": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "name": r.1, "description": r.2, "cover_url": r.3,
        "is_private": r.4, "members_count": r.5, "created_at": r.6,
        "owner": { "username": r.7, "full_name": r.8 }
    })).collect::<Vec<_>>() })))
}

async fn create_group(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateGroupRequest>,
) -> Result<Json<serde_json::Value>> {
    let id = Uuid::new_v4();
    sqlx::query("INSERT INTO groups (id, name, description, is_private, cover_url, owner_id) VALUES ($1,$2,$3,$4,$5,$6)")
        .bind(id).bind(&req.name).bind(&req.description).bind(req.is_private.unwrap_or(false))
        .bind(&req.cover_url).bind(auth.user_id).execute(&state.db).await?;
    sqlx::query("INSERT INTO group_members (group_id, user_id, role) VALUES ($1,$2,'owner')")
        .bind(id).bind(auth.user_id).execute(&state.db).await?;
    get_group_by_id(&state.db, id, auth.user_id).await.map(Json)
}

async fn get_group(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    get_group_by_id(&state.db, id, auth.user_id).await.map(Json)
}

async fn get_group_by_id(db: &sqlx::PgPool, id: Uuid, user_id: Uuid) -> Result<serde_json::Value> {
    let row = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<String>, bool, i32, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT g.id, g.name, g.description, g.cover_url, g.is_private, g.members_count, g.created_at,
                u.username, u.full_name, u.avatar_url
         FROM groups g JOIN users u ON u.id=g.owner_id WHERE g.id=$1"
    ).bind(id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Group".into()))?;
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_active=true)"
    ).bind(id).bind(user_id).fetch_one(db).await.unwrap_or(false);
    Ok(serde_json::json!({
        "id": row.0, "name": row.1, "description": row.2, "cover_url": row.3,
        "is_private": row.4, "members_count": row.5, "created_at": row.6, "is_member": is_member,
        "owner": { "username": row.7, "full_name": row.8, "avatar_url": row.9 }
    }))
}

async fn update_group(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateGroupRequest>,
) -> Result<Json<serde_json::Value>> {
    let owner: Option<Uuid> = sqlx::query_scalar("SELECT owner_id FROM groups WHERE id=$1")
        .bind(id).fetch_optional(&state.db).await?;
    if owner != Some(auth.user_id) { return Err(AppError::Forbidden); }
    sqlx::query("UPDATE groups SET name=$1, description=$2, is_private=$3, cover_url=$4, updated_at=NOW() WHERE id=$5")
        .bind(&req.name).bind(&req.description).bind(req.is_private.unwrap_or(false)).bind(&req.cover_url).bind(id)
        .execute(&state.db).await?;
    get_group_by_id(&state.db, id, auth.user_id).await.map(Json)
}

async fn delete_group(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let owner: Option<Uuid> = sqlx::query_scalar("SELECT owner_id FROM groups WHERE id=$1")
        .bind(id).fetch_optional(&state.db).await?;
    if owner != Some(auth.user_id) { return Err(AppError::Forbidden); }
    sqlx::query("DELETE FROM groups WHERE id=$1").bind(id).execute(&state.db).await?;
    Ok(Json(serde_json::json!({ "message": "Group deleted" })))
}

async fn join_group(State(state): State<AppState>, auth: AuthUser, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>> {
    sqlx::query("INSERT INTO group_members (group_id, user_id, role) VALUES ($1,$2,'member') ON CONFLICT DO NOTHING")
        .bind(id).bind(auth.user_id).execute(&state.db).await?;
    sqlx::query("UPDATE groups SET members_count=members_count+1 WHERE id=$1").bind(id).execute(&state.db).await?;
    Ok(Json(serde_json::json!({ "message": "Joined group" })))
}

async fn leave_group(State(state): State<AppState>, auth: AuthUser, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>> {
    sqlx::query("UPDATE group_members SET is_active=false WHERE group_id=$1 AND user_id=$2")
        .bind(id).bind(auth.user_id).execute(&state.db).await?;
    sqlx::query("UPDATE groups SET members_count=GREATEST(members_count-1,0) WHERE id=$1").bind(id).execute(&state.db).await?;
    Ok(Json(serde_json::json!({ "message": "Left group" })))
}

async fn get_members(State(state): State<AppState>, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, String, DateTime<chrono::Utc>)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, u.headline, gm.role, gm.joined_at
         FROM group_members gm JOIN users u ON u.id=gm.user_id
         WHERE gm.group_id=$1 AND gm.is_active=true ORDER BY gm.joined_at"
    ).bind(id).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "members": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4, "role": r.5, "joined_at": r.6
    })).collect::<Vec<_>>() })))
}

async fn get_group_posts(State(state): State<AppState>, Path(id): Path<Uuid>, Query(q): Query<GroupQuery>) -> Result<Json<serde_json::Value>> {
    let p = Pagination::new(q.page.unwrap_or(1), q.limit.unwrap_or(20));
    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, i32, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT p.id, p.content, p.post_type::text, p.likes_count, p.comments_count, p.created_at,
                u.username, u.full_name, u.avatar_url
         FROM group_posts gp JOIN posts p ON p.id=gp.post_id JOIN users u ON u.id=p.author_id
         WHERE gp.group_id=$1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(id).bind(p.limit).bind(p.offset).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "posts": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "likes_count": r.3, "comments_count": r.4, "created_at": r.5,
        "author": { "username": r.6, "full_name": r.7, "avatar_url": r.8 }
    })).collect::<Vec<_>>() })))
}

async fn create_group_post(State(state): State<AppState>, auth: AuthUser, Path(group_id): Path<Uuid>, Json(body): Json<serde_json::Value>) -> Result<Json<serde_json::Value>> {
    let is_member: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_active=true)")
        .bind(group_id).bind(auth.user_id).fetch_one(&state.db).await?;
    if !is_member { return Err(AppError::Forbidden); }
    let post_id = Uuid::new_v4();
    let content = body["content"].as_str().unwrap_or("").to_string();
    sqlx::query("INSERT INTO posts (id, author_id, content, post_type) VALUES ($1,$2,$3,'text')")
        .bind(post_id).bind(auth.user_id).bind(&content).execute(&state.db).await?;
    sqlx::query("INSERT INTO group_posts (group_id, post_id) VALUES ($1,$2)")
        .bind(group_id).bind(post_id).execute(&state.db).await?;
    Ok(Json(serde_json::json!({ "post": { "id": post_id, "content": content } })))
}

use axum::{
    Router, Json, extract::{State, Path, Query, Multipart},
    routing::{get, post, put, delete},
};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::{AuthUser, OptionalAuth};
use crate::services::posts as post_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_feed).post(create_post))
        .route("/trending", get(get_trending))
        .route("/hashtag/:tag", get(get_by_hashtag))
        .route("/:id", get(get_post).put(update_post).delete(delete_post))
        .route("/:id/like", post(like_post).delete(unlike_post))
        .route("/:id/save", post(save_post).delete(unsave_post))
        .route("/:id/share", post(share_post))
        .route("/:id/comments", get(get_comments).post(add_comment))
        .route("/:id/comments/:comment_id", put(update_comment).delete(delete_comment))
        .route("/:id/comments/:comment_id/like", post(like_comment))
}

#[derive(Deserialize)]
pub struct FeedQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub post_type: Option<String>,
}

#[derive(Deserialize)]
pub struct CreatePostRequest {
    pub content: String,
    pub post_type: Option<String>,
    pub media_urls: Option<Vec<String>>,
    pub hashtags: Option<Vec<String>>,
    pub mentions: Option<Vec<Uuid>>,
    pub visibility: Option<String>,
}

#[derive(Deserialize)]
pub struct CommentRequest {
    pub content: String,
    pub parent_id: Option<Uuid>,
}

async fn get_feed(
    State(state): State<AppState>,
    OptionalAuth(auth): OptionalAuth,
    Query(q): Query<FeedQuery>,
) -> Result<Json<serde_json::Value>> {
    let user_id = auth.map(|a| a.user_id);
    let posts = post_service::get_feed(&state.db, &state.redis, user_id, q.page.unwrap_or(1), q.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "posts": posts, "page": q.page.unwrap_or(1) })))
}

async fn create_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreatePostRequest>,
) -> Result<Json<serde_json::Value>> {
    let post = post_service::create_post(&state.db, &state.ws_state, auth.user_id, req).await?;
    Ok(Json(serde_json::json!({ "post": post })))
}

async fn get_post(
    State(state): State<AppState>,
    OptionalAuth(auth): OptionalAuth,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let user_id = auth.map(|a| a.user_id);
    let post = post_service::get_post(&state.db, id, user_id).await?;
    Ok(Json(serde_json::json!({ "post": post })))
}

async fn update_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<CreatePostRequest>,
) -> Result<Json<serde_json::Value>> {
    let post = post_service::update_post(&state.db, auth.user_id, id, req).await?;
    Ok(Json(serde_json::json!({ "post": post })))
}

async fn delete_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    post_service::delete_post(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Post deleted" })))
}

async fn like_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let count = post_service::like_post(&state.db, &state.ws_state, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "likes_count": count })))
}

async fn unlike_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let count = post_service::unlike_post(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "likes_count": count })))
}

async fn save_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    post_service::save_post(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Post saved" })))
}

async fn unsave_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    post_service::unsave_post(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Post unsaved" })))
}

async fn share_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let post = post_service::share_post(&state.db, &state.ws_state, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "post": post })))
}

async fn get_trending(
    State(state): State<AppState>,
    Query(q): Query<FeedQuery>,
) -> Result<Json<serde_json::Value>> {
    let posts = post_service::get_trending(&state.db, &state.redis).await?;
    Ok(Json(serde_json::json!({ "posts": posts })))
}

async fn get_by_hashtag(
    State(state): State<AppState>,
    Path(tag): Path<String>,
    Query(q): Query<FeedQuery>,
) -> Result<Json<serde_json::Value>> {
    let posts = post_service::get_by_hashtag(&state.db, &tag, q.page.unwrap_or(1), q.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "posts": posts, "hashtag": tag })))
}

async fn get_comments(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(q): Query<FeedQuery>,
) -> Result<Json<serde_json::Value>> {
    let comments = post_service::get_comments(&state.db, id, q.page.unwrap_or(1), q.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "comments": comments })))
}

async fn add_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<CommentRequest>,
) -> Result<Json<serde_json::Value>> {
    let comment = post_service::add_comment(&state.db, &state.ws_state, auth.user_id, id, req.content, req.parent_id).await?;
    Ok(Json(serde_json::json!({ "comment": comment })))
}

async fn update_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((post_id, comment_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<CommentRequest>,
) -> Result<Json<serde_json::Value>> {
    let comment = post_service::update_comment(&state.db, auth.user_id, comment_id, req.content).await?;
    Ok(Json(serde_json::json!({ "comment": comment })))
}

async fn delete_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((post_id, comment_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    post_service::delete_comment(&state.db, auth.user_id, comment_id).await?;
    Ok(Json(serde_json::json!({ "message": "Comment deleted" })))
}

async fn like_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((post_id, comment_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    let count = post_service::like_comment(&state.db, auth.user_id, comment_id).await?;
    Ok(Json(serde_json::json!({ "likes_count": count })))
}

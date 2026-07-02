use axum::{
    Router, Json, extract::{State, Path, Query, Multipart},
    routing::{get, post, put, delete, patch},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::{AppError, Result};
use crate::middleware::auth::{AuthUser, OptionalAuth};
use crate::services::users as user_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(search_users))
        .route("/:id", get(get_user_profile))
        .route("/me/profile", put(update_profile))
        .route("/me/avatar", post(upload_avatar))
        .route("/me/cover", post(upload_cover))
        .route("/me/resume", post(upload_resume))
        .route("/:id/follow", post(follow_user))
        .route("/:id/unfollow", delete(unfollow_user))
        .route("/:id/followers", get(get_followers))
        .route("/:id/following", get(get_following))
        .route("/me/feed", get(get_personalized_feed))
        .route("/me/saved-posts", get(get_saved_posts))
        .route("/me/analytics", get(get_profile_analytics))
        .route("/trending", get(get_trending_users))
        .route("/suggestions", get(get_suggestions))
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub skills: Option<String>,
    pub location: Option<String>,
    pub open_to_work: Option<bool>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub headline: Option<String>,
    pub bio: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub github_username: Option<String>,
    pub linkedin_url: Option<String>,
    pub open_to_work: Option<bool>,
    pub skills: Option<Vec<crate::models::Skill>>,
    pub experience: Option<Vec<crate::models::Experience>>,
    pub education: Option<Vec<crate::models::Education>>,
    pub portfolio_links: Option<Vec<crate::models::PortfolioLink>>,
}

async fn get_user_profile(
    State(state): State<AppState>,
    OptionalAuth(auth): OptionalAuth,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>> {
    let viewer_id = auth.map(|a| a.user_id);
    // Accept either UUID or username
    let user_id = if let Ok(uuid) = id.parse::<Uuid>() {
        uuid
    } else {
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM users WHERE username=$1 AND status='active'")
            .bind(&id)
            .fetch_optional(&state.db).await?
            .ok_or_else(|| AppError::NotFound("User".into()))?
    };
    let profile = user_service::get_profile(&state.db, user_id, viewer_id).await?;
    Ok(Json(serde_json::json!({ "profile": profile })))
}

async fn update_profile(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateProfileRequest>,
) -> Result<Json<serde_json::Value>> {
    let profile = user_service::update_profile(&state.db, auth.user_id, req).await?;
    Ok(Json(serde_json::json!({ "profile": profile })))
}

async fn upload_avatar(
    State(state): State<AppState>,
    auth: AuthUser,
    multipart: Multipart,
) -> Result<Json<serde_json::Value>> {
    let url = user_service::upload_avatar(&state.db, &state.config, auth.user_id, multipart).await?;
    Ok(Json(serde_json::json!({ "avatar_url": url })))
}

async fn upload_cover(
    State(state): State<AppState>,
    auth: AuthUser,
    multipart: Multipart,
) -> Result<Json<serde_json::Value>> {
    let url = user_service::upload_cover(&state.db, &state.config, auth.user_id, multipart).await?;
    Ok(Json(serde_json::json!({ "cover_url": url })))
}

async fn upload_resume(
    State(state): State<AppState>,
    auth: AuthUser,
    multipart: Multipart,
) -> Result<Json<serde_json::Value>> {
    let url = user_service::upload_resume(&state.db, &state.config, auth.user_id, multipart).await?;
    Ok(Json(serde_json::json!({ "resume_url": url })))
}

async fn follow_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(target_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    user_service::follow_user(&state.db, &state.ws_state, auth.user_id, target_id).await?;
    Ok(Json(serde_json::json!({ "message": "Following" })))
}

async fn unfollow_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(target_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    user_service::unfollow_user(&state.db, auth.user_id, target_id).await?;
    Ok(Json(serde_json::json!({ "message": "Unfollowed" })))
}

async fn get_followers(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let result = user_service::get_followers(&state.db, id, params.page.unwrap_or(1), params.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "data": result })))
}

async fn get_following(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let result = user_service::get_following(&state.db, id, params.page.unwrap_or(1), params.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "data": result })))
}

async fn search_users(
    State(state): State<AppState>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let result = user_service::search_users(&state.db, &state.redis, params).await?;
    Ok(Json(serde_json::json!({ "data": result })))
}

async fn get_personalized_feed(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let posts = user_service::get_personalized_feed(&state.db, &state.redis, auth.user_id, params.page.unwrap_or(1), params.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "posts": posts })))
}

async fn get_saved_posts(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let posts = user_service::get_saved_posts(&state.db, auth.user_id, params.page.unwrap_or(1), params.limit.unwrap_or(20)).await?;
    Ok(Json(serde_json::json!({ "posts": posts })))
}

async fn get_profile_analytics(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let analytics = user_service::get_profile_analytics(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "analytics": analytics })))
}

async fn get_trending_users(
    State(state): State<AppState>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let users = user_service::get_trending_users(&state.db, &state.redis).await?;
    Ok(Json(serde_json::json!({ "users": users })))
}

async fn get_suggestions(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let users = user_service::get_suggestions(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "suggestions": users })))
}

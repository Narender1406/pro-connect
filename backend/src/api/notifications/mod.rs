use axum::{Router, Json, extract::{State, Path, Query}, routing::{get, post, put, delete}};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;
use crate::services::notifications as notif_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_notifications))
        .route("/unread-count", get(get_unread_count))
        .route("/:id/read", put(mark_read))
        .route("/read-all", put(mark_all_read))
        .route("/:id", delete(delete_notification))
        .route("/preferences", get(get_preferences).put(update_preferences))
}

#[derive(Deserialize)]
pub struct NotifQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub unread_only: Option<bool>,
}

async fn get_notifications(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<NotifQuery>,
) -> Result<Json<serde_json::Value>> {
    let notifs = notif_service::get_notifications(&state.db, auth.user_id, q.page.unwrap_or(1), q.limit.unwrap_or(20), q.unread_only.unwrap_or(false)).await?;
    Ok(Json(serde_json::json!({ "notifications": notifs })))
}

async fn get_unread_count(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let count = notif_service::get_unread_count(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "count": count })))
}

async fn mark_read(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    notif_service::mark_read(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Marked as read" })))
}

async fn mark_all_read(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    notif_service::mark_all_read(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "message": "All marked as read" })))
}

async fn delete_notification(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    notif_service::delete_notification(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Deleted" })))
}

async fn get_preferences(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let prefs = notif_service::get_preferences(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "preferences": prefs })))
}

async fn update_preferences(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(prefs): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    notif_service::update_preferences(&state.db, auth.user_id, prefs).await?;
    Ok(Json(serde_json::json!({ "message": "Preferences updated" })))
}

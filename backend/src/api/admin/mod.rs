use axum::{Router, Json, extract::{State, Path, Query}, routing::{get, post, put, delete}};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::{AppError, Result};
use crate::middleware::auth::AuthUser;
use crate::models::UserRole;
use crate::services::admin as admin_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(list_users))
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .route("/users/:id/suspend", post(suspend_user))
        .route("/users/:id/activate", post(activate_user))
        .route("/posts", get(list_posts))
        .route("/posts/:id", delete(remove_post))
        .route("/analytics", get(get_analytics))
        .route("/audit-logs", get(get_audit_logs))
        .route("/reports", get(get_reports))
        .route("/system/health", get(system_health))
}

#[derive(Deserialize)]
pub struct AdminQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub q: Option<String>,
    pub status: Option<String>,
    pub role: Option<String>,
}

fn require_admin(auth: &AuthUser) -> Result<()> {
    if auth.role != UserRole::Admin && auth.role != UserRole::SuperAdmin {
        return Err(AppError::Forbidden);
    }
    Ok(())
}

async fn list_users(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<AdminQuery>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let result = admin_service::list_users(&state.db, q).await?;
    Ok(Json(serde_json::json!({ "data": result })))
}

async fn get_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let user = admin_service::get_user_detail(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "user": user })))
}

async fn update_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let user = admin_service::update_user(&state.db, id, body).await?;
    Ok(Json(serde_json::json!({ "user": user })))
}

async fn delete_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    if auth.role != UserRole::SuperAdmin {
        return Err(AppError::Forbidden);
    }
    admin_service::delete_user(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "message": "User deleted" })))
}

async fn suspend_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let reason = body["reason"].as_str().unwrap_or("Policy violation").to_string();
    admin_service::suspend_user(&state.db, id, &reason).await?;
    Ok(Json(serde_json::json!({ "message": "User suspended" })))
}

async fn activate_user(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    admin_service::activate_user(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "message": "User activated" })))
}

async fn list_posts(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<AdminQuery>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let posts = admin_service::list_posts(&state.db, q).await?;
    Ok(Json(serde_json::json!({ "posts": posts })))
}

async fn remove_post(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    admin_service::remove_post(&state.db, id, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "message": "Post removed" })))
}

async fn get_analytics(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let analytics = admin_service::get_platform_analytics(&state.db).await?;
    Ok(Json(serde_json::json!({ "analytics": analytics })))
}

async fn get_audit_logs(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<AdminQuery>,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let logs = admin_service::get_audit_logs(&state.db, q.page.unwrap_or(1), q.limit.unwrap_or(50)).await?;
    Ok(Json(serde_json::json!({ "logs": logs })))
}

async fn get_reports(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let reports = admin_service::get_reports(&state.db).await?;
    Ok(Json(serde_json::json!({ "reports": reports })))
}

async fn system_health(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    require_admin(&auth)?;
    let health = admin_service::system_health(&state.db, &state.redis).await?;
    Ok(Json(serde_json::json!({ "health": health })))
}

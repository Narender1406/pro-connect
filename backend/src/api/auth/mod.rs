use axum::{
    Router, Json, extract::{State, Path, Query},
    routing::{get, post, put, delete},
    http::HeaderMap,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;
use crate::api::AppState;
use crate::errors::{AppError, Result};
use crate::middleware::auth::AuthUser;
use crate::services::auth as auth_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/logout", post(logout))
        .route("/refresh", post(refresh_token))
        .route("/verify-email/:token", get(verify_email))
        .route("/forgot-password", post(forgot_password))
        .route("/reset-password", post(reset_password))
        .route("/2fa/setup", post(setup_2fa))
        .route("/2fa/verify", post(verify_2fa))
        .route("/2fa/disable", post(disable_2fa))
        .route("/sessions", get(get_sessions))
        .route("/sessions/:id", delete(revoke_session))
        .route("/me", get(get_me))
        .route("/change-password", put(change_password))
}

#[derive(Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    #[validate(length(min = 3, max = 30))]
    pub username: String,
    #[validate(length(min = 2, max = 100))]
    pub full_name: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
}

#[derive(Deserialize, Validate)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub totp_code: Option<String>,
    pub device_name: Option<String>,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Deserialize, Validate)]
pub struct ForgotPasswordRequest {
    #[validate(email)]
    pub email: String,
}

#[derive(Deserialize, Validate)]
pub struct ResetPasswordRequest {
    pub token: String,
    #[validate(length(min = 8))]
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct Verify2FARequest {
    pub code: String,
}

#[derive(Deserialize, Validate)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    #[validate(length(min = 8))]
    pub new_password: String,
}

async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    let ip = extract_ip(&headers);
    let result = auth_service::register(&state.db, &state.redis, &state.config, req, ip).await?;
    Ok(Json(serde_json::json!({ "message": "Registration successful. Please verify your email.", "user": result })))
}

async fn login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>> {
    let ip = extract_ip(&headers);
    let ua = headers.get("user-agent").and_then(|v| v.to_str().ok()).map(String::from);
    let result = auth_service::login(&state.db, &state.redis, &state.config, req, ip, ua).await?;
    Ok(Json(result))
}

async fn logout(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<serde_json::Value>> {
    auth_service::logout(&state.db, &state.redis, auth.user_id, &req.refresh_token).await?;
    Ok(Json(serde_json::json!({ "message": "Logged out successfully" })))
}

async fn refresh_token(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<serde_json::Value>> {
    let ip = extract_ip(&headers);
    let ua = headers.get("user-agent").and_then(|v| v.to_str().ok()).map(String::from);
    let result = auth_service::refresh_token(&state.db, &state.redis, &state.config, &req.refresh_token, ip, ua).await?;
    Ok(Json(result))
}

async fn verify_email(
    State(state): State<AppState>,
    Path(token): Path<String>,
) -> Result<Json<serde_json::Value>> {
    auth_service::verify_email(&state.db, &state.redis, &token).await?;
    Ok(Json(serde_json::json!({ "message": "Email verified successfully" })))
}

async fn forgot_password(
    State(state): State<AppState>,
    Json(req): Json<ForgotPasswordRequest>,
) -> Result<Json<serde_json::Value>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    auth_service::forgot_password(&state.db, &state.redis, &state.config, &req.email).await?;
    Ok(Json(serde_json::json!({ "message": "If the email exists, a reset link has been sent" })))
}

async fn reset_password(
    State(state): State<AppState>,
    Json(req): Json<ResetPasswordRequest>,
) -> Result<Json<serde_json::Value>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    auth_service::reset_password(&state.db, &state.redis, &state.config, &req.token, &req.new_password).await?;
    Ok(Json(serde_json::json!({ "message": "Password reset successfully" })))
}

async fn setup_2fa(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let result = auth_service::setup_2fa(&state.db, auth.user_id).await?;
    Ok(Json(result))
}

async fn verify_2fa(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<Verify2FARequest>,
) -> Result<Json<serde_json::Value>> {
    auth_service::enable_2fa(&state.db, auth.user_id, &req.code).await?;
    Ok(Json(serde_json::json!({ "message": "2FA enabled successfully" })))
}

async fn disable_2fa(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<Verify2FARequest>,
) -> Result<Json<serde_json::Value>> {
    auth_service::disable_2fa(&state.db, auth.user_id, &req.code).await?;
    Ok(Json(serde_json::json!({ "message": "2FA disabled" })))
}

async fn get_sessions(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let sessions = auth_service::get_sessions(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "sessions": sessions })))
}

async fn revoke_session(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(session_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    auth_service::revoke_session(&state.db, auth.user_id, session_id).await?;
    Ok(Json(serde_json::json!({ "message": "Session revoked" })))
}

async fn get_me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let user = auth_service::get_me(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "user": user })))
}

async fn change_password(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    auth_service::change_password(&state.db, &state.config, auth.user_id, &req.current_password, &req.new_password).await?;
    Ok(Json(serde_json::json!({ "message": "Password changed successfully" })))
}

fn extract_ip(headers: &HeaderMap) -> Option<String> {
    headers.get("x-forwarded-for")
        .or_else(|| headers.get("x-real-ip"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string())
}

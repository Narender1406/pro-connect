use axum::{
    Router, Json, extract::{State, Path, Query},
    routing::{get, post, put, delete},
};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;
use crate::services::{workspace as ws_service, projects as proj_service};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_workspaces).post(create_workspace))
        .route("/:id", get(get_workspace).put(update_workspace).delete(delete_workspace))
        .route("/:id/members", get(get_members).post(invite_member))
        .route("/:id/members/:user_id", put(update_member_role).delete(remove_member))
        .route("/:id/invite", post(send_invite))
        .route("/join/:token", post(join_workspace))
}

#[derive(Deserialize)]
pub struct CreateWorkspaceRequest {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub industry: Option<String>,
    pub website: Option<String>,
    pub size: Option<String>,
}

#[derive(Deserialize)]
pub struct InviteMemberRequest {
    pub email: String,
    pub role: String,
}

#[derive(Deserialize)]
pub struct UpdateRoleRequest {
    pub role: String,
}

async fn get_workspaces(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let workspaces = ws_service::get_user_workspaces(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "workspaces": workspaces })))
}

async fn create_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateWorkspaceRequest>,
) -> Result<Json<serde_json::Value>> {
    let ws = ws_service::create_workspace(&state.db, auth.user_id, req).await?;
    Ok(Json(serde_json::json!({ "workspace": ws })))
}

async fn get_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let ws = ws_service::get_workspace(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "workspace": ws })))
}

async fn update_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateWorkspaceRequest>,
) -> Result<Json<serde_json::Value>> {
    let ws = ws_service::update_workspace(&state.db, auth.user_id, id, req).await?;
    Ok(Json(serde_json::json!({ "workspace": ws })))
}

async fn delete_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    ws_service::delete_workspace(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Workspace deleted" })))
}

async fn get_members(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let members = ws_service::get_members(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "members": members })))
}

async fn invite_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<InviteMemberRequest>,
) -> Result<Json<serde_json::Value>> {
    ws_service::invite_member(&state.db, &state.config, auth.user_id, id, req).await?;
    Ok(Json(serde_json::json!({ "message": "Invitation sent" })))
}

async fn update_member_role(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, user_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<UpdateRoleRequest>,
) -> Result<Json<serde_json::Value>> {
    ws_service::update_member_role(&state.db, auth.user_id, ws_id, user_id, &req.role).await?;
    Ok(Json(serde_json::json!({ "message": "Role updated" })))
}

async fn remove_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    ws_service::remove_member(&state.db, auth.user_id, ws_id, user_id).await?;
    Ok(Json(serde_json::json!({ "message": "Member removed" })))
}

async fn send_invite(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<InviteMemberRequest>,
) -> Result<Json<serde_json::Value>> {
    let token = ws_service::generate_invite_token(&state.db, &state.redis, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "invite_token": token })))
}

async fn join_workspace(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(token): Path<String>,
) -> Result<Json<serde_json::Value>> {
    let ws = ws_service::join_with_token(&state.db, &state.redis, auth.user_id, &token).await?;
    Ok(Json(serde_json::json!({ "workspace": ws })))
}

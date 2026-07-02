use axum::{
    Router, Json, extract::{State, Path, Query},
    routing::{get, post, put, delete, patch},
};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;
use crate::services::projects as proj_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/workspaces/:ws_id/projects", get(get_projects).post(create_project))
        .route("/workspaces/:ws_id/projects/:id", get(get_project).put(update_project).delete(delete_project))
        .route("/workspaces/:ws_id/projects/:id/tasks", get(get_tasks).post(create_task))
        .route("/workspaces/:ws_id/projects/:id/tasks/:task_id", get(get_task).put(update_task).delete(delete_task))
        .route("/workspaces/:ws_id/projects/:id/tasks/:task_id/move", patch(move_task))
        .route("/workspaces/:ws_id/projects/:id/tasks/:task_id/comments", get(get_task_comments).post(add_task_comment))
        .route("/workspaces/:ws_id/projects/:id/board", get(get_board))
        .route("/workspaces/:ws_id/projects/:id/activity", get(get_activity))
}

#[derive(Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub board_column: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub priority: Option<String>,
    pub labels: Option<Vec<String>>,
    pub due_date: Option<String>,
    pub estimated_hours: Option<f32>,
}

#[derive(Deserialize)]
pub struct MoveTaskRequest {
    pub board_column: String,
    pub position: f64,
}

#[derive(Deserialize)]
pub struct TaskQuery {
    pub column: Option<String>,
    pub assignee: Option<Uuid>,
    pub priority: Option<String>,
}

async fn get_projects(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(ws_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let projects = proj_service::get_projects(&state.db, auth.user_id, ws_id).await?;
    Ok(Json(serde_json::json!({ "projects": projects })))
}

async fn create_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(ws_id): Path<Uuid>,
    Json(req): Json<CreateProjectRequest>,
) -> Result<Json<serde_json::Value>> {
    let project = proj_service::create_project(&state.db, auth.user_id, ws_id, req).await?;
    Ok(Json(serde_json::json!({ "project": project })))
}

async fn get_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    let project = proj_service::get_project(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "project": project })))
}

async fn update_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, id)): Path<(Uuid, Uuid)>,
    Json(req): Json<CreateProjectRequest>,
) -> Result<Json<serde_json::Value>> {
    let project = proj_service::update_project(&state.db, auth.user_id, id, req).await?;
    Ok(Json(serde_json::json!({ "project": project })))
}

async fn delete_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    proj_service::delete_project(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Project deleted" })))
}

async fn get_tasks(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id)): Path<(Uuid, Uuid)>,
    Query(q): Query<TaskQuery>,
) -> Result<Json<serde_json::Value>> {
    let tasks = proj_service::get_tasks(&state.db, auth.user_id, project_id, q).await?;
    Ok(Json(serde_json::json!({ "tasks": tasks })))
}

async fn create_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<serde_json::Value>> {
    let task = proj_service::create_task(&state.db, &state.ws_state, auth.user_id, project_id, req).await?;
    Ok(Json(serde_json::json!({ "task": task })))
}

async fn get_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id, task_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    let task = proj_service::get_task(&state.db, auth.user_id, task_id).await?;
    Ok(Json(serde_json::json!({ "task": task })))
}

async fn update_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id, task_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<serde_json::Value>> {
    let task = proj_service::update_task(&state.db, &state.ws_state, auth.user_id, task_id, req).await?;
    Ok(Json(serde_json::json!({ "task": task })))
}

async fn delete_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id, task_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    proj_service::delete_task(&state.db, auth.user_id, task_id).await?;
    Ok(Json(serde_json::json!({ "message": "Task deleted" })))
}

async fn move_task(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id, task_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(req): Json<MoveTaskRequest>,
) -> Result<Json<serde_json::Value>> {
    let task = proj_service::move_task(&state.db, &state.ws_state, auth.user_id, task_id, &req.board_column, req.position).await?;
    Ok(Json(serde_json::json!({ "task": task })))
}

async fn get_board(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    let board = proj_service::get_board(&state.db, auth.user_id, project_id).await?;
    Ok(Json(serde_json::json!({ "board": board })))
}

async fn get_task_comments(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id, task_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    let comments = proj_service::get_task_comments(&state.db, task_id).await?;
    Ok(Json(serde_json::json!({ "comments": comments })))
}

async fn add_task_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id, task_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>> {
    let content = body["content"].as_str().unwrap_or_default().to_string();
    let comment = proj_service::add_task_comment(&state.db, auth.user_id, task_id, content).await?;
    Ok(Json(serde_json::json!({ "comment": comment })))
}

async fn get_activity(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((ws_id, project_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    let logs = proj_service::get_activity_logs(&state.db, project_id).await?;
    Ok(Json(serde_json::json!({ "activity": logs })))
}

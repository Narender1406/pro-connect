use axum::{Router, Json, extract::{State, Path, Query, Multipart}, routing::{get, post, delete}};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;
use crate::services::files as file_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/upload", post(upload_file))
        .route("/:id", get(get_file).delete(delete_file))
        .route("/", get(list_files))
}

#[derive(Deserialize)]
pub struct FileQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub file_type: Option<String>,
}

async fn upload_file(
    State(state): State<AppState>,
    auth: AuthUser,
    multipart: Multipart,
) -> Result<Json<serde_json::Value>> {
    let file = file_service::upload_file(&state.db, &state.config, auth.user_id, multipart).await?;
    Ok(Json(serde_json::json!({ "file": file })))
}

async fn get_file(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let file = file_service::get_file(&state.db, id).await?;
    Ok(Json(serde_json::json!({ "file": file })))
}

async fn delete_file(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    file_service::delete_file(&state.db, &state.config, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "File deleted" })))
}

async fn list_files(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<FileQuery>,
) -> Result<Json<serde_json::Value>> {
    let files = file_service::list_files(&state.db, auth.user_id, q).await?;
    Ok(Json(serde_json::json!({ "files": files })))
}

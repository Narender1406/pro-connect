use axum::{
    Router, Json, extract::{State, Path, Query},
    routing::{get, post, put, delete},
};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;
use crate::services::chat as chat_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/conversations", get(get_conversations).post(create_conversation))
        .route("/conversations/:id", get(get_conversation))
        .route("/conversations/:id/messages", get(get_messages).post(send_message))
        .route("/conversations/:id/messages/:msg_id", put(edit_message).delete(delete_message))
        .route("/conversations/:id/messages/:msg_id/react", post(react_to_message))
        .route("/conversations/:id/read", post(mark_read))
        .route("/conversations/:id/members", post(add_member).delete(remove_member))
        .route("/conversations/search", get(search_messages))
}

#[derive(Deserialize)]
pub struct CreateConversationRequest {
    pub member_ids: Vec<Uuid>,
    pub name: Option<String>,
    pub is_group: bool,
}

#[derive(Deserialize)]
pub struct SendMessageRequest {
    pub content: Option<String>,
    pub message_type: Option<String>,
    pub media_url: Option<String>,
    pub reply_to_id: Option<Uuid>,
}

#[derive(Deserialize)]
pub struct ReactRequest {
    pub emoji: String,
}

#[derive(Deserialize)]
pub struct MemberRequest {
    pub user_id: Uuid,
}

#[derive(Deserialize)]
pub struct MessageQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub before: Option<String>,
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
    pub conversation_id: Option<Uuid>,
}

async fn get_conversations(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let convs = chat_service::get_conversations(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "conversations": convs })))
}

async fn create_conversation(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateConversationRequest>,
) -> Result<Json<serde_json::Value>> {
    let conv = chat_service::create_conversation(&state.db, auth.user_id, req).await?;
    Ok(Json(serde_json::json!({ "conversation": conv })))
}

async fn get_conversation(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let conv = chat_service::get_conversation(&state.db, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "conversation": conv })))
}

async fn get_messages(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Query(q): Query<MessageQuery>,
) -> Result<Json<serde_json::Value>> {
    let msgs = chat_service::get_messages(&state.db, auth.user_id, id, q.page.unwrap_or(1), q.limit.unwrap_or(50)).await?;
    Ok(Json(serde_json::json!({ "messages": msgs })))
}

async fn send_message(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<SendMessageRequest>,
) -> Result<Json<serde_json::Value>> {
    let msg = chat_service::send_message(&state.db, &state.ws_state, auth.user_id, id, req).await?;
    Ok(Json(serde_json::json!({ "message": msg })))
}

async fn edit_message(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((conv_id, msg_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<SendMessageRequest>,
) -> Result<Json<serde_json::Value>> {
    let msg = chat_service::edit_message(&state.db, &state.ws_state, auth.user_id, msg_id, req.content.unwrap_or_default()).await?;
    Ok(Json(serde_json::json!({ "message": msg })))
}

async fn delete_message(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((conv_id, msg_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>> {
    chat_service::delete_message(&state.db, &state.ws_state, auth.user_id, msg_id).await?;
    Ok(Json(serde_json::json!({ "message": "Message deleted" })))
}

async fn react_to_message(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((conv_id, msg_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<ReactRequest>,
) -> Result<Json<serde_json::Value>> {
    chat_service::react_to_message(&state.db, &state.ws_state, auth.user_id, msg_id, req.emoji).await?;
    Ok(Json(serde_json::json!({ "message": "Reaction added" })))
}

async fn mark_read(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    chat_service::mark_read(&state.db, &state.ws_state, auth.user_id, id).await?;
    Ok(Json(serde_json::json!({ "message": "Marked as read" })))
}

async fn add_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<MemberRequest>,
) -> Result<Json<serde_json::Value>> {
    chat_service::add_member(&state.db, auth.user_id, id, req.user_id).await?;
    Ok(Json(serde_json::json!({ "message": "Member added" })))
}

async fn remove_member(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<MemberRequest>,
) -> Result<Json<serde_json::Value>> {
    chat_service::remove_member(&state.db, auth.user_id, id, req.user_id).await?;
    Ok(Json(serde_json::json!({ "message": "Member removed" })))
}

async fn search_messages(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<SearchQuery>,
) -> Result<Json<serde_json::Value>> {
    let results = chat_service::search_messages(&state.db, auth.user_id, &q.q, q.conversation_id).await?;
    Ok(Json(serde_json::json!({ "results": results })))
}

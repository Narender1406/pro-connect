use axum::{Router, routing::{get, post, put, delete, patch}};
use std::sync::Arc;
use sqlx::PgPool;
use redis::aio::ConnectionManager;
use crate::config::AppConfig;
use crate::websocket::WsState;

pub mod auth;
pub mod users;
pub mod posts;
pub mod chat;
pub mod workspace;
pub mod projects;
pub mod notifications;
pub mod admin;
pub mod files;
pub mod analytics;
pub mod ai;
pub mod search;
pub mod groups;
pub mod calendar;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub redis: ConnectionManager,
    pub config: AppConfig,
    pub ws_state: Arc<WsState>,
}

impl AppState {
    pub fn new(db: PgPool, redis: ConnectionManager, config: AppConfig) -> Self {
        Self { db, redis, config, ws_state: Arc::new(WsState::new()) }
    }
}

pub fn routes(state: AppState) -> Router {
    Router::new()
        .nest("/auth", auth::routes())
        .nest("/users", users::routes())
        .nest("/posts", posts::routes())
        .nest("/chat", chat::routes())
        .nest("/workspaces", workspace::routes())
        .nest("/projects", projects::routes())
        .nest("/notifications", notifications::routes())
        .nest("/admin", admin::routes())
        .nest("/files", files::routes())
        .nest("/analytics", analytics::routes())
        .nest("/ai", ai::routes())
        .nest("/search", search::routes())
        .nest("/groups", groups::routes())
        .nest("/calendar", calendar::routes())
        .with_state(state)
}

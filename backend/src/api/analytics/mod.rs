use axum::{Router, Json, extract::{State, Query}, routing::get};
use serde::Deserialize;
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;
use crate::services::analytics as analytics_service;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/me", get(my_analytics))
        .route("/workspace/:id", get(workspace_analytics))
        .route("/engagement", get(engagement_stats))
}

#[derive(Deserialize)]
pub struct AnalyticsQuery {
    pub period: Option<String>,
}

async fn my_analytics(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(q): Query<AnalyticsQuery>,
) -> Result<Json<serde_json::Value>> {
    let data = analytics_service::user_analytics(&state.db, auth.user_id, &q.period.unwrap_or_else(|| "30d".into())).await?;
    Ok(Json(serde_json::json!({ "analytics": data })))
}

async fn workspace_analytics(
    State(state): State<AppState>,
    auth: AuthUser,
    axum::extract::Path(ws_id): axum::extract::Path<uuid::Uuid>,
    Query(q): Query<AnalyticsQuery>,
) -> Result<Json<serde_json::Value>> {
    let data = analytics_service::workspace_analytics(&state.db, ws_id, &q.period.unwrap_or_else(|| "30d".into())).await?;
    Ok(Json(serde_json::json!({ "analytics": data })))
}

async fn engagement_stats(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>> {
    let data = analytics_service::engagement_stats(&state.db, auth.user_id).await?;
    Ok(Json(serde_json::json!({ "engagement": data })))
}

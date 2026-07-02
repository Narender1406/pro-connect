use axum::{Router, Json, extract::{State, Path, Query}, routing::{get, post, put, delete}};
use serde::Deserialize;
use uuid::Uuid;
use chrono::DateTime;
use crate::api::AppState;
use crate::errors::{AppError, Result};
use crate::middleware::auth::AuthUser;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/events", get(list_events).post(create_event))
        .route("/events/:id", get(get_event).put(update_event).delete(delete_event))
        .route("/events/:id/rsvp", post(rsvp_event))
        .route("/upcoming", get(upcoming_events))
}

#[derive(Deserialize)]
pub struct CreateEventRequest {
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_at: String,
    pub end_at: String,
    pub all_day: Option<bool>,
    pub color: Option<String>,
    pub workspace_id: Option<Uuid>,
    pub attendee_ids: Option<Vec<Uuid>>,
}

#[derive(Deserialize)]
pub struct EventsQuery { pub from: Option<String>, pub to: Option<String> }

#[derive(Deserialize)]
pub struct RsvpRequest { pub status: String }

async fn list_events(State(state): State<AppState>, auth: AuthUser, Query(_q): Query<EventsQuery>) -> Result<Json<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<String>, DateTime<chrono::Utc>, DateTime<chrono::Utc>, bool, Option<String>, String, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT e.id, e.title, e.description, e.location, e.start_at, e.end_at,
                e.all_day, e.color, e.status::text, e.created_at,
                u.username, u.full_name, u.avatar_url
         FROM calendar_events e JOIN users u ON u.id=e.organizer_id
         LEFT JOIN calendar_event_attendees a ON a.event_id=e.id AND a.user_id=$1
         WHERE e.organizer_id=$1 OR a.user_id=$1 ORDER BY e.start_at ASC"
    ).bind(auth.user_id).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "events": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "title": r.1, "description": r.2, "location": r.3,
        "start_at": r.4, "end_at": r.5, "all_day": r.6, "color": r.7, "status": r.8, "created_at": r.9,
        "organizer": { "username": r.10, "full_name": r.11, "avatar_url": r.12 }
    })).collect::<Vec<_>>() })))
}

async fn create_event(State(state): State<AppState>, auth: AuthUser, Json(req): Json<CreateEventRequest>) -> Result<Json<serde_json::Value>> {
    let event_id = Uuid::new_v4();
    let start: DateTime<chrono::Utc> = req.start_at.parse().map_err(|_| AppError::BadRequest("Invalid start_at".into()))?;
    let end: DateTime<chrono::Utc> = req.end_at.parse().map_err(|_| AppError::BadRequest("Invalid end_at".into()))?;
    if end <= start { return Err(AppError::BadRequest("end_at must be after start_at".into())); }
    sqlx::query(
        "INSERT INTO calendar_events (id, organizer_id, workspace_id, title, description, location, start_at, end_at, all_day, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)"
    ).bind(event_id).bind(auth.user_id).bind(req.workspace_id)
    .bind(&req.title).bind(&req.description).bind(&req.location)
    .bind(start).bind(end).bind(req.all_day.unwrap_or(false)).bind(&req.color)
    .execute(&state.db).await?;
    if let Some(attendees) = req.attendee_ids {
        for uid in attendees {
            sqlx::query("INSERT INTO calendar_event_attendees (event_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING")
                .bind(event_id).bind(uid).execute(&state.db).await.ok();
        }
    }
    get_event_by_id(&state.db, event_id).await.map(Json)
}

async fn get_event(State(state): State<AppState>, _auth: AuthUser, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>> {
    get_event_by_id(&state.db, id).await.map(Json)
}

async fn get_event_by_id(db: &sqlx::PgPool, id: Uuid) -> Result<serde_json::Value> {
    let row = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<String>, DateTime<chrono::Utc>, DateTime<chrono::Utc>, bool, Option<String>, String, DateTime<chrono::Utc>, String, String, Option<String>)>(
        "SELECT e.id, e.title, e.description, e.location, e.start_at, e.end_at,
                e.all_day, e.color, e.status::text, e.created_at,
                u.username, u.full_name, u.avatar_url
         FROM calendar_events e JOIN users u ON u.id=e.organizer_id WHERE e.id=$1"
    ).bind(id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Event".into()))?;

    let attendees = sqlx::query_as::<_, (Uuid, String, String, Option<String>, String)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, a.status::text
         FROM calendar_event_attendees a JOIN users u ON u.id=a.user_id WHERE a.event_id=$1"
    ).bind(id).fetch_all(db).await?;

    Ok(serde_json::json!({
        "id": row.0, "title": row.1, "description": row.2, "location": row.3,
        "start_at": row.4, "end_at": row.5, "all_day": row.6, "color": row.7, "status": row.8, "created_at": row.9,
        "organizer": { "username": row.10, "full_name": row.11, "avatar_url": row.12 },
        "attendees": attendees.iter().map(|a| serde_json::json!({
            "id": a.0, "username": a.1, "full_name": a.2, "avatar_url": a.3, "status": a.4
        })).collect::<Vec<_>>()
    }))
}

async fn update_event(State(state): State<AppState>, auth: AuthUser, Path(id): Path<Uuid>, Json(req): Json<CreateEventRequest>) -> Result<Json<serde_json::Value>> {
    let organizer: Option<Uuid> = sqlx::query_scalar("SELECT organizer_id FROM calendar_events WHERE id=$1")
        .bind(id).fetch_optional(&state.db).await?;
    if organizer != Some(auth.user_id) { return Err(AppError::Forbidden); }
    let start: DateTime<chrono::Utc> = req.start_at.parse().map_err(|_| AppError::BadRequest("Invalid start_at".into()))?;
    let end: DateTime<chrono::Utc> = req.end_at.parse().map_err(|_| AppError::BadRequest("Invalid end_at".into()))?;
    sqlx::query("UPDATE calendar_events SET title=$1, description=$2, location=$3, start_at=$4, end_at=$5, color=$6, updated_at=NOW() WHERE id=$7")
        .bind(&req.title).bind(&req.description).bind(&req.location).bind(start).bind(end).bind(&req.color).bind(id)
        .execute(&state.db).await?;
    get_event_by_id(&state.db, id).await.map(Json)
}

async fn delete_event(State(state): State<AppState>, auth: AuthUser, Path(id): Path<Uuid>) -> Result<Json<serde_json::Value>> {
    let organizer: Option<Uuid> = sqlx::query_scalar("SELECT organizer_id FROM calendar_events WHERE id=$1")
        .bind(id).fetch_optional(&state.db).await?;
    if organizer != Some(auth.user_id) { return Err(AppError::Forbidden); }
    sqlx::query("DELETE FROM calendar_events WHERE id=$1").bind(id).execute(&state.db).await?;
    Ok(Json(serde_json::json!({ "message": "Event deleted" })))
}

async fn rsvp_event(State(state): State<AppState>, auth: AuthUser, Path(id): Path<Uuid>, Json(req): Json<RsvpRequest>) -> Result<Json<serde_json::Value>> {
    sqlx::query("INSERT INTO calendar_event_attendees (event_id, user_id, status, responded_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (event_id, user_id) DO UPDATE SET status=$3, responded_at=NOW()")
        .bind(id).bind(auth.user_id).bind(&req.status).execute(&state.db).await?;
    Ok(Json(serde_json::json!({ "message": "RSVP updated", "status": req.status })))
}

async fn upcoming_events(State(state): State<AppState>, auth: AuthUser) -> Result<Json<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, DateTime<chrono::Utc>, DateTime<chrono::Utc>, Option<String>, bool)>(
        "SELECT e.id, e.title, e.start_at, e.end_at, e.color, e.all_day
         FROM calendar_events e
         LEFT JOIN calendar_event_attendees a ON a.event_id=e.id AND a.user_id=$1
         WHERE (e.organizer_id=$1 OR a.user_id=$1) AND e.start_at >= NOW() AND e.status='scheduled'
         ORDER BY e.start_at ASC LIMIT 10"
    ).bind(auth.user_id).fetch_all(&state.db).await?;
    Ok(Json(serde_json::json!({ "events": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "title": r.1, "start_at": r.2, "end_at": r.3, "color": r.4, "all_day": r.5
    })).collect::<Vec<_>>() })))
}

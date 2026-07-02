use sqlx::PgPool;
use uuid::Uuid;
use std::sync::Arc;
use crate::api::projects::*;
use crate::errors::{AppError, Result};
use crate::websocket::WsState;

pub async fn get_projects(db: &PgPool, user_id: Uuid, ws_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let is_member: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM org_members WHERE org_id=$1 AND user_id=$2 AND is_active=true)")
        .bind(ws_id).bind(user_id).fetch_one(db).await?;
    if !is_member { return Err(AppError::Forbidden); }
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, Option<chrono::DateTime<chrono::Utc>>, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, name, description, status::text, due_date, created_at FROM projects WHERE workspace_id=$1 ORDER BY created_at DESC"
    ).bind(ws_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "name": r.1, "description": r.2, "status": r.3, "due_date": r.4, "created_at": r.5
    })).collect())
}

pub async fn create_project(db: &PgPool, user_id: Uuid, ws_id: Uuid, req: CreateProjectRequest) -> Result<serde_json::Value> {
    let proj_id = Uuid::new_v4();
    let due_date: Option<chrono::DateTime<chrono::Utc>> = req.due_date.as_ref().and_then(|d| d.parse().ok());
    sqlx::query("INSERT INTO projects (id, workspace_id, name, description, owner_id, due_date) VALUES ($1,$2,$3,$4,$5,$6)")
        .bind(proj_id).bind(ws_id).bind(&req.name).bind(&req.description).bind(user_id).bind(due_date).execute(db).await?;
    get_project(db, user_id, proj_id).await
}

pub async fn get_project(db: &PgPool, _user_id: Uuid, proj_id: Uuid) -> Result<serde_json::Value> {
    let row = sqlx::query_as::<_, (Uuid, String, Option<String>, String, Uuid, Option<chrono::DateTime<chrono::Utc>>, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, name, description, status::text, workspace_id, due_date, created_at FROM projects WHERE id=$1"
    ).bind(proj_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Project".into()))?;
    Ok(serde_json::json!({
        "id": row.0, "name": row.1, "description": row.2, "status": row.3,
        "workspace_id": row.4, "due_date": row.5, "created_at": row.6
    }))
}

pub async fn update_project(db: &PgPool, user_id: Uuid, proj_id: Uuid, req: CreateProjectRequest) -> Result<serde_json::Value> {
    let due_date: Option<chrono::DateTime<chrono::Utc>> = req.due_date.as_ref().and_then(|d| d.parse().ok());
    sqlx::query("UPDATE projects SET name=$1, description=$2, due_date=$3, updated_at=NOW() WHERE id=$4 AND owner_id=$5")
        .bind(&req.name).bind(&req.description).bind(due_date).bind(proj_id).bind(user_id).execute(db).await?;
    get_project(db, user_id, proj_id).await
}

pub async fn delete_project(db: &PgPool, user_id: Uuid, proj_id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM projects WHERE id=$1 AND owner_id=$2").bind(proj_id).bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn get_tasks(db: &PgPool, _user_id: Uuid, proj_id: Uuid, _q: TaskQuery) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, String, Vec<String>, Option<chrono::DateTime<chrono::Utc>>, f64, Option<f32>, chrono::DateTime<chrono::Utc>, Option<Uuid>, Option<String>, Option<String>, Option<String>)>(
        "SELECT t.id, t.title, t.description, t.board_column, t.priority::text,
                t.labels, t.due_date, t.position, t.estimated_hours, t.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id
         WHERE t.project_id=$1 ORDER BY t.board_column, t.position"
    ).bind(proj_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "title": r.1, "description": r.2, "board_column": r.3, "priority": r.4,
        "labels": r.5, "due_date": r.6, "position": r.7, "estimated_hours": r.8, "created_at": r.9,
        "assignee": r.10.map(|_| serde_json::json!({ "id": r.10, "username": r.11, "full_name": r.12, "avatar_url": r.13 }))
    })).collect())
}

pub async fn create_task(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, proj_id: Uuid, req: CreateTaskRequest) -> Result<serde_json::Value> {
    let task_id = Uuid::new_v4();
    let max_pos: f64 = sqlx::query_scalar::<_, Option<f64>>(
        "SELECT MAX(position) FROM tasks WHERE project_id=$1 AND board_column=$2"
    ).bind(proj_id).bind(req.board_column.as_deref().unwrap_or("todo")).fetch_one(db).await?.unwrap_or(0.0) + 1.0;

    let due_date: Option<chrono::DateTime<chrono::Utc>> = req.due_date.as_ref().and_then(|d| d.parse().ok());
    let labels = req.labels.unwrap_or_default();
    sqlx::query(
        "INSERT INTO tasks (id, project_id, title, description, board_column, assignee_id, reporter_id, priority, labels, due_date, position, estimated_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::task_priority,$9,$10,$11,$12)"
    ).bind(task_id).bind(proj_id).bind(&req.title).bind(&req.description)
    .bind(req.board_column.as_deref().unwrap_or("todo")).bind(&req.assignee_id).bind(user_id)
    .bind(req.priority.as_deref().unwrap_or("medium")).bind(&labels).bind(due_date).bind(max_pos).bind(req.estimated_hours)
    .execute(db).await?;

    if let Some(assignee) = req.assignee_id {
        if assignee != user_id {
            super::notifications::create_notification(db, ws_state, crate::models::NotificationType::TaskAssigned,
                assignee, Some(user_id), Some(task_id), Some("task".into())).await.ok();
        }
    }
    log_activity(db, proj_id, user_id, "task_created", &req.title).await.ok();
    get_task(db, user_id, task_id).await
}

pub async fn get_task(db: &PgPool, _user_id: Uuid, task_id: Uuid) -> Result<serde_json::Value> {
    let row = sqlx::query_as::<_, (Uuid, String, Option<String>, String, String, Vec<String>, Option<chrono::DateTime<chrono::Utc>>, f64, Option<f32>, Option<f32>, Uuid, chrono::DateTime<chrono::Utc>, Option<Uuid>, Option<String>, Option<String>, Option<String>)>(
        "SELECT t.id, t.title, t.description, t.board_column, t.priority::text,
                t.labels, t.due_date, t.position, t.estimated_hours, t.logged_hours, t.project_id, t.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id WHERE t.id=$1"
    ).bind(task_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Task".into()))?;
    Ok(serde_json::json!({
        "id": row.0, "title": row.1, "description": row.2, "board_column": row.3, "priority": row.4,
        "labels": row.5, "due_date": row.6, "position": row.7, "estimated_hours": row.8,
        "logged_hours": row.9, "project_id": row.10, "created_at": row.11,
        "assignee": row.12.map(|_| serde_json::json!({ "id": row.12, "username": row.13, "full_name": row.14, "avatar_url": row.15 }))
    }))
}

pub async fn update_task(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, task_id: Uuid, req: CreateTaskRequest) -> Result<serde_json::Value> {
    let due_date: Option<chrono::DateTime<chrono::Utc>> = req.due_date.as_ref().and_then(|d| d.parse().ok());
    let labels = req.labels.unwrap_or_default();
    sqlx::query("UPDATE tasks SET title=$1, description=$2, assignee_id=$3, priority=$4::task_priority, labels=$5, due_date=$6, estimated_hours=$7, updated_at=NOW() WHERE id=$8")
        .bind(&req.title).bind(&req.description).bind(&req.assignee_id)
        .bind(req.priority.as_deref().unwrap_or("medium")).bind(&labels)
        .bind(due_date).bind(req.estimated_hours).bind(task_id).execute(db).await?;
    get_task(db, user_id, task_id).await
}

pub async fn delete_task(db: &PgPool, _user_id: Uuid, task_id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM tasks WHERE id=$1").bind(task_id).execute(db).await?;
    Ok(())
}

pub async fn move_task(db: &PgPool, _ws_state: &Arc<WsState>, user_id: Uuid, task_id: Uuid, column: &str, position: f64) -> Result<serde_json::Value> {
    sqlx::query("UPDATE tasks SET board_column=$1, position=$2, updated_at=NOW() WHERE id=$3")
        .bind(column).bind(position).bind(task_id).execute(db).await?;
    get_task(db, user_id, task_id).await
}

pub async fn get_board(db: &PgPool, user_id: Uuid, proj_id: Uuid) -> Result<serde_json::Value> {
    let tasks = get_tasks(db, user_id, proj_id, TaskQuery { column: None, assignee: None, priority: None }).await?;
    let mut todo = vec![];
    let mut in_progress = vec![];
    let mut in_review = vec![];
    let mut done = vec![];
    for t in tasks {
        match t["board_column"].as_str().unwrap_or("todo") {
            "in_progress" => in_progress.push(t),
            "in_review" => in_review.push(t),
            "done" => done.push(t),
            _ => todo.push(t),
        }
    }
    Ok(serde_json::json!({ "todo": todo, "in_progress": in_progress, "in_review": in_review, "done": done }))
}

pub async fn get_task_comments(db: &PgPool, task_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT tc.id, tc.content, tc.created_at, u.id, u.username, u.full_name, u.avatar_url
         FROM task_comments tc JOIN users u ON u.id=tc.author_id WHERE tc.task_id=$1 ORDER BY tc.created_at"
    ).bind(task_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "created_at": r.2,
        "author": { "id": r.3, "username": r.4, "full_name": r.5, "avatar_url": r.6 }
    })).collect())
}

pub async fn add_task_comment(db: &PgPool, user_id: Uuid, task_id: Uuid, content: String) -> Result<serde_json::Value> {
    let id = Uuid::new_v4();
    sqlx::query("INSERT INTO task_comments (id, task_id, author_id, content) VALUES ($1,$2,$3,$4)")
        .bind(id).bind(task_id).bind(user_id).bind(&content).execute(db).await?;
    let u = sqlx::query_as::<_, (String, String, Option<String>)>(
        "SELECT username, full_name, avatar_url FROM users WHERE id=$1"
    ).bind(user_id).fetch_one(db).await?;
    Ok(serde_json::json!({
        "id": id, "content": content, "created_at": chrono::Utc::now(),
        "author": { "id": user_id, "username": u.0, "full_name": u.1, "avatar_url": u.2 }
    }))
}

pub async fn get_activity_logs(db: &PgPool, proj_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT al.id, al.action, al.entity, al.created_at, u.id, u.username, u.full_name, u.avatar_url
         FROM activity_logs al JOIN users u ON u.id=al.actor_id
         WHERE al.project_id=$1 ORDER BY al.created_at DESC LIMIT 100"
    ).bind(proj_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "action": r.1, "entity": r.2, "created_at": r.3,
        "actor": { "id": r.4, "username": r.5, "full_name": r.6, "avatar_url": r.7 }
    })).collect())
}

async fn log_activity(db: &PgPool, proj_id: Uuid, actor_id: Uuid, action: &str, entity: &str) -> Result<()> {
    sqlx::query("INSERT INTO activity_logs (id, project_id, actor_id, action, entity) VALUES ($1,$2,$3,$4,$5)")
        .bind(Uuid::new_v4()).bind(proj_id).bind(actor_id).bind(action).bind(entity).execute(db).await?;
    Ok(())
}

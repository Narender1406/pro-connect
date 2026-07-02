use sqlx::PgPool;
use uuid::Uuid;
use std::sync::Arc;
use crate::errors::Result;
use crate::models::NotificationType;
use crate::websocket::{WsState, WsEvent};

pub async fn create_notification(
    db: &PgPool, ws_state: &Arc<WsState>, notif_type: NotificationType,
    user_id: Uuid, actor_id: Option<Uuid>, entity_id: Option<Uuid>, entity_type: Option<String>,
) -> Result<()> {
    let id = Uuid::new_v4();
    let (title, body) = get_notif_text(&notif_type, db, actor_id).await;
    let type_str = format!("{:?}", notif_type).to_lowercase();
    sqlx::query(
        "INSERT INTO notifications (id, user_id, actor_id, notification_type, title, body, entity_id, entity_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"
    ).bind(id).bind(user_id).bind(actor_id).bind(&type_str)
    .bind(&title).bind(&body).bind(entity_id).bind(&entity_type).execute(db).await?;

    let notif = serde_json::json!({
        "id": id, "type": type_str, "title": title, "body": body,
        "entity_id": entity_id, "entity_type": entity_type, "is_read": false,
        "created_at": chrono::Utc::now()
    });
    ws_state.send_to_user(user_id, WsEvent::Notification(notif)).await;
    Ok(())
}

async fn get_notif_text(notif_type: &NotificationType, db: &PgPool, actor_id: Option<Uuid>) -> (String, String) {
    let actor_name = if let Some(aid) = actor_id {
        sqlx::query_scalar::<_, String>("SELECT full_name FROM users WHERE id=$1")
            .bind(aid).fetch_optional(db).await.ok().flatten().unwrap_or_else(|| "Someone".into())
    } else { "System".into() };

    match notif_type {
        NotificationType::Follow => (format!("{} followed you", actor_name), "You have a new follower".into()),
        NotificationType::Like => (format!("{} liked your post", actor_name), "Your post got a like".into()),
        NotificationType::Comment => (format!("{} commented on your post", actor_name), "New comment on your post".into()),
        NotificationType::Reply => (format!("{} replied to your comment", actor_name), "New reply".into()),
        NotificationType::Mention => (format!("{} mentioned you", actor_name), "You were mentioned".into()),
        NotificationType::Message => (format!("{} sent you a message", actor_name), "New message".into()),
        NotificationType::TaskAssigned => ("New task assigned".into(), format!("{} assigned you a task", actor_name)),
        NotificationType::WorkspaceInvite => ("Workspace invitation".into(), format!("{} invited you", actor_name)),
        _ => ("Notification".into(), "You have a new notification".into()),
    }
}

pub async fn get_notifications(db: &PgPool, user_id: Uuid, page: i64, limit: i64, unread_only: bool) -> Result<Vec<serde_json::Value>> {
    let offset = ((page - 1) * limit).max(0);
    let rows = sqlx::query_as::<_, (Uuid, String, String, String, Option<Uuid>, Option<String>, bool, chrono::DateTime<chrono::Utc>, Option<Uuid>, Option<String>, Option<String>, Option<String>)>(
        "SELECT n.id, n.notification_type, n.title, n.body, n.entity_id, n.entity_type,
                n.is_read, n.created_at, u.id, u.username, u.full_name, u.avatar_url
         FROM notifications n LEFT JOIN users u ON u.id=n.actor_id
         WHERE n.user_id=$1 AND ($2 = false OR n.is_read=false)
         ORDER BY n.created_at DESC LIMIT $3 OFFSET $4"
    ).bind(user_id).bind(unread_only).bind(limit).bind(offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "type": r.1, "title": r.2, "body": r.3, "entity_id": r.4,
        "entity_type": r.5, "is_read": r.6, "created_at": r.7,
        "actor": r.8.map(|_| serde_json::json!({ "id": r.8, "username": r.9, "full_name": r.10, "avatar_url": r.11 }))
    })).collect())
}

pub async fn get_unread_count(db: &PgPool, user_id: Uuid) -> Result<i64> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false")
        .bind(user_id).fetch_one(db).await?;
    Ok(count)
}

pub async fn mark_read(db: &PgPool, user_id: Uuid, notif_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2").bind(notif_id).bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn mark_all_read(db: &PgPool, user_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false").bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn delete_notification(db: &PgPool, user_id: Uuid, notif_id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM notifications WHERE id=$1 AND user_id=$2").bind(notif_id).bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn get_preferences(db: &PgPool, user_id: Uuid) -> Result<serde_json::Value> {
    let prefs: Option<serde_json::Value> = sqlx::query_scalar("SELECT notification_preferences FROM users WHERE id=$1")
        .bind(user_id).fetch_optional(db).await?.flatten();
    Ok(prefs.unwrap_or_else(|| serde_json::json!({
        "email_notifications": true, "push_notifications": true,
        "follow_notifications": true, "like_notifications": true,
        "comment_notifications": true, "message_notifications": true, "task_notifications": true
    })))
}

pub async fn update_preferences(db: &PgPool, user_id: Uuid, prefs: serde_json::Value) -> Result<()> {
    sqlx::query("UPDATE users SET notification_preferences=$1 WHERE id=$2").bind(&prefs).bind(user_id).execute(db).await?;
    Ok(())
}

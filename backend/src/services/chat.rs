use sqlx::PgPool;
use uuid::Uuid;
use std::sync::Arc;
use crate::api::chat::{CreateConversationRequest, SendMessageRequest};
use crate::errors::{AppError, Result};
use crate::utils::Pagination;
use crate::websocket::{WsState, WsEvent};

pub async fn get_conversations(db: &PgPool, user_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, Option<String>, bool, Option<String>, Option<chrono::DateTime<chrono::Utc>>, chrono::DateTime<chrono::Utc>, i64)>(
        "SELECT c.id, c.name, c.is_group, c.avatar_url, c.last_message_at, c.created_at,
                (SELECT COUNT(*) FROM conversation_members cm2 WHERE cm2.conversation_id=c.id) as member_count
         FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id
         WHERE cm.user_id=$1 AND cm.is_active=true ORDER BY c.last_message_at DESC NULLS LAST"
    ).bind(user_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "name": r.1, "is_group": r.2, "avatar_url": r.3,
        "last_message_at": r.4, "created_at": r.5, "member_count": r.6
    })).collect())
}

pub async fn create_conversation(db: &PgPool, creator_id: Uuid, req: CreateConversationRequest) -> Result<serde_json::Value> {
    if !req.is_group && req.member_ids.len() == 1 {
        let other_id = req.member_ids[0];
        let existing: Option<Uuid> = sqlx::query_scalar(
            "SELECT c.id FROM conversations c
             JOIN conversation_members cm1 ON cm1.conversation_id=c.id AND cm1.user_id=$1
             JOIN conversation_members cm2 ON cm2.conversation_id=c.id AND cm2.user_id=$2
             WHERE c.is_group=false LIMIT 1"
        ).bind(creator_id).bind(other_id).fetch_optional(db).await?;
        if let Some(id) = existing {
            return get_conversation(db, creator_id, id).await;
        }
    }
    let conv_id = Uuid::new_v4();
    sqlx::query("INSERT INTO conversations (id, name, is_group, created_by) VALUES ($1,$2,$3,$4)")
        .bind(conv_id).bind(&req.name).bind(req.is_group).bind(creator_id).execute(db).await?;
    let mut all_members = req.member_ids.clone();
    all_members.push(creator_id);
    all_members.dedup();
    for uid in &all_members {
        sqlx::query("INSERT INTO conversation_members (conversation_id, user_id, role) VALUES ($1,$2,$3)")
            .bind(conv_id).bind(uid).bind(if *uid == creator_id { "admin" } else { "member" }).execute(db).await?;
    }
    get_conversation(db, creator_id, conv_id).await
}

pub async fn get_conversation(db: &PgPool, user_id: Uuid, conv_id: Uuid) -> Result<serde_json::Value> {
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND is_active=true)"
    ).bind(conv_id).bind(user_id).fetch_one(db).await?;
    if !is_member { return Err(AppError::Forbidden); }

    let row = sqlx::query_as::<_, (Uuid, Option<String>, bool, Option<String>, Option<chrono::DateTime<chrono::Utc>>, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, name, is_group, avatar_url, last_message_at, created_at FROM conversations WHERE id=$1"
    ).bind(conv_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Conversation".into()))?;

    let members = sqlx::query_as::<_, (Uuid, String, String, Option<String>, String)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, cm.role
         FROM conversation_members cm JOIN users u ON u.id=cm.user_id
         WHERE cm.conversation_id=$1 AND cm.is_active=true"
    ).bind(conv_id).fetch_all(db).await?;

    Ok(serde_json::json!({
        "id": row.0, "name": row.1, "is_group": row.2, "avatar_url": row.3,
        "last_message_at": row.4, "created_at": row.5,
        "members": members.iter().map(|m| serde_json::json!({
            "id": m.0, "username": m.1, "full_name": m.2, "avatar_url": m.3, "role": m.4
        })).collect::<Vec<_>>()
    }))
}

pub async fn get_messages(db: &PgPool, user_id: Uuid, conv_id: Uuid, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND is_active=true)"
    ).bind(conv_id).bind(user_id).fetch_one(db).await?;
    if !is_member { return Err(AppError::Forbidden); }

    let p = Pagination::new(page, limit);
    let rows = sqlx::query_as::<_, (Uuid, Option<String>, String, Option<String>, Option<Uuid>, bool, bool, serde_json::Value, serde_json::Value, chrono::DateTime<chrono::Utc>, Uuid, String, String, Option<String>)>(
        "SELECT m.id, m.content, m.message_type::text, m.media_url, m.reply_to_id,
                m.is_edited, m.is_deleted, m.read_by, m.reactions, m.created_at,
                u.id, u.username, u.full_name, u.avatar_url
         FROM messages m JOIN users u ON u.id=m.sender_id
         WHERE m.conversation_id=$1 ORDER BY m.created_at DESC LIMIT $2 OFFSET $3"
    ).bind(conv_id).bind(p.limit).bind(p.offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0,
        "content": if r.6 { Some("Message deleted".to_string()) } else { r.1.clone() },
        "message_type": r.2, "media_url": r.3, "reply_to_id": r.4,
        "is_edited": r.5, "is_deleted": r.6, "read_by": r.7, "reactions": r.8, "created_at": r.9,
        "sender": { "id": r.10, "username": r.11, "full_name": r.12, "avatar_url": r.13 }
    })).collect())
}

pub async fn send_message(db: &PgPool, ws_state: &Arc<WsState>, user_id: Uuid, conv_id: Uuid, req: SendMessageRequest) -> Result<serde_json::Value> {
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND is_active=true)"
    ).bind(conv_id).bind(user_id).fetch_one(db).await?;
    if !is_member { return Err(AppError::Forbidden); }

    let msg_id = Uuid::new_v4();
    let msg_type = req.message_type.unwrap_or_else(|| "text".into());
    sqlx::query(
        "INSERT INTO messages (id, conversation_id, sender_id, content, message_type, media_url, reply_to_id, read_by)
         VALUES ($1,$2,$3,$4,$5::message_type,$6,$7,$8)"
    ).bind(msg_id).bind(conv_id).bind(user_id).bind(&req.content)
    .bind(&msg_type).bind(&req.media_url).bind(&req.reply_to_id)
    .bind(serde_json::json!([user_id])).execute(db).await?;

    sqlx::query("UPDATE conversations SET last_message_id=$1, last_message_at=NOW() WHERE id=$2")
        .bind(msg_id).bind(conv_id).execute(db).await?;

    let sender = sqlx::query_as::<_, (String, String, Option<String>)>(
        "SELECT username, full_name, avatar_url FROM users WHERE id=$1"
    ).bind(user_id).fetch_one(db).await?;

    let msg = serde_json::json!({
        "id": msg_id, "conversation_id": conv_id, "content": req.content,
        "message_type": msg_type, "media_url": req.media_url, "reply_to_id": req.reply_to_id,
        "is_edited": false, "is_deleted": false, "read_by": [user_id], "reactions": [],
        "created_at": chrono::Utc::now(),
        "sender": { "id": user_id, "username": sender.0, "full_name": sender.1, "avatar_url": sender.2 }
    });
    ws_state.broadcast_to_conversation(conv_id, WsEvent::NewMessage(msg.clone())).await;
    Ok(msg)
}

pub async fn edit_message(db: &PgPool, _ws_state: &Arc<WsState>, user_id: Uuid, msg_id: Uuid, content: String) -> Result<serde_json::Value> {
    let rows = sqlx::query("UPDATE messages SET content=$1, is_edited=true, updated_at=NOW() WHERE id=$2 AND sender_id=$3 AND is_deleted=false")
        .bind(&content).bind(msg_id).bind(user_id).execute(db).await?.rows_affected();
    if rows == 0 { return Err(AppError::Forbidden); }
    Ok(serde_json::json!({ "id": msg_id, "content": content, "is_edited": true }))
}

pub async fn delete_message(db: &PgPool, _ws_state: &Arc<WsState>, user_id: Uuid, msg_id: Uuid) -> Result<()> {
    let rows = sqlx::query("UPDATE messages SET is_deleted=true, content=NULL, updated_at=NOW() WHERE id=$1 AND sender_id=$2")
        .bind(msg_id).bind(user_id).execute(db).await?.rows_affected();
    if rows == 0 { return Err(AppError::Forbidden); }
    Ok(())
}

pub async fn react_to_message(db: &PgPool, _ws_state: &Arc<WsState>, user_id: Uuid, msg_id: Uuid, emoji: String) -> Result<()> {
    sqlx::query("UPDATE messages SET reactions = reactions || $1::jsonb WHERE id=$2")
        .bind(serde_json::json!([{"user_id": user_id, "emoji": emoji}])).bind(msg_id).execute(db).await?;
    Ok(())
}

pub async fn mark_read(db: &PgPool, _ws_state: &Arc<WsState>, user_id: Uuid, conv_id: Uuid) -> Result<()> {
    sqlx::query(
        "UPDATE messages SET read_by = CASE WHEN read_by @> $1::jsonb THEN read_by ELSE read_by || $1::jsonb END
         WHERE conversation_id=$2 AND NOT (read_by @> $1::jsonb)"
    ).bind(serde_json::json!([user_id])).bind(conv_id).execute(db).await?;
    Ok(())
}

pub async fn add_member(db: &PgPool, user_id: Uuid, conv_id: Uuid, new_member: Uuid) -> Result<()> {
    let is_admin: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND role='admin')"
    ).bind(conv_id).bind(user_id).fetch_one(db).await?;
    if !is_admin { return Err(AppError::Forbidden); }
    sqlx::query("INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING")
        .bind(conv_id).bind(new_member).execute(db).await?;
    Ok(())
}

pub async fn remove_member(db: &PgPool, user_id: Uuid, conv_id: Uuid, member_id: Uuid) -> Result<()> {
    let is_admin: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND role='admin')"
    ).bind(conv_id).bind(user_id).fetch_one(db).await?;
    if !is_admin && user_id != member_id { return Err(AppError::Forbidden); }
    sqlx::query("UPDATE conversation_members SET is_active=false WHERE conversation_id=$1 AND user_id=$2")
        .bind(conv_id).bind(member_id).execute(db).await?;
    Ok(())
}

pub async fn search_messages(db: &PgPool, user_id: Uuid, query: &str, conv_id: Option<Uuid>) -> Result<Vec<serde_json::Value>> {
    let search = format!("%{}%", query);
    let rows = sqlx::query_as::<_, (Uuid, Option<String>, chrono::DateTime<chrono::Utc>, Uuid, Uuid, String, String, Option<String>)>(
        "SELECT m.id, m.content, m.created_at, m.conversation_id,
                u.id, u.username, u.full_name, u.avatar_url
         FROM messages m JOIN users u ON u.id=m.sender_id
         JOIN conversation_members cm ON cm.conversation_id=m.conversation_id AND cm.user_id=$1
         WHERE m.content ILIKE $2 AND m.is_deleted=false
         AND ($3::uuid IS NULL OR m.conversation_id=$3)
         ORDER BY m.created_at DESC LIMIT 50"
    ).bind(user_id).bind(&search).bind(conv_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "created_at": r.2, "conversation_id": r.3,
        "sender": { "id": r.4, "username": r.5, "full_name": r.6, "avatar_url": r.7 }
    })).collect())
}

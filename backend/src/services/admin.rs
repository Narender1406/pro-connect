use sqlx::PgPool;
use redis::aio::ConnectionManager;
use uuid::Uuid;
use crate::api::admin::AdminQuery;
use crate::errors::{AppError, Result};

pub async fn list_users(db: &PgPool, q: AdminQuery) -> Result<serde_json::Value> {
    let offset = ((q.page.unwrap_or(1) - 1) * q.limit.unwrap_or(20)).max(0);
    let search = format!("%{}%", q.q.unwrap_or_default());
    let rows = sqlx::query_as::<_, (Uuid, String, String, String, String, String, bool, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, i32, i32)>(
        "SELECT id, email, username, full_name, role::text, status::text, email_verified, created_at, last_seen_at, followers_count, posts_count
         FROM users WHERE (full_name ILIKE $1 OR email ILIKE $1 OR username ILIKE $1)
         ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    ).bind(&search).bind(q.limit.unwrap_or(20)).bind(offset).fetch_all(db).await?;
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users").fetch_one(db).await?;
    Ok(serde_json::json!({ "users": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "email": r.1, "username": r.2, "full_name": r.3, "role": r.4, "status": r.5,
        "email_verified": r.6, "created_at": r.7, "last_seen_at": r.8, "followers_count": r.9, "posts_count": r.10
    })).collect::<Vec<_>>(), "total": total }))
}

pub async fn get_user_detail(db: &PgPool, user_id: Uuid) -> Result<serde_json::Value> {
    let row = sqlx::query_as::<_, (Uuid, String, String, String, String, String, bool, bool, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, i32, i32, i32)>(
        "SELECT id, email, username, full_name, role::text, status::text, email_verified, two_factor_enabled,
                created_at, last_seen_at, followers_count, following_count, posts_count FROM users WHERE id=$1"
    ).bind(user_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("User".into()))?;
    Ok(serde_json::json!({
        "id": row.0, "email": row.1, "username": row.2, "full_name": row.3, "role": row.4, "status": row.5,
        "email_verified": row.6, "two_factor_enabled": row.7, "created_at": row.8, "last_seen_at": row.9,
        "followers_count": row.10, "following_count": row.11, "posts_count": row.12
    }))
}

pub async fn update_user(db: &PgPool, user_id: Uuid, body: serde_json::Value) -> Result<serde_json::Value> {
    if let Some(role) = body["role"].as_str() {
        sqlx::query("UPDATE users SET role=$1::user_role WHERE id=$2").bind(role).bind(user_id).execute(db).await?;
    }
    get_user_detail(db, user_id).await
}

pub async fn delete_user(db: &PgPool, user_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE users SET status='deactivated', email=CONCAT(email, '.deleted.', $1) WHERE id=$2")
        .bind(Uuid::new_v4().to_string()).bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn suspend_user(db: &PgPool, user_id: Uuid, reason: &str) -> Result<()> {
    sqlx::query("UPDATE users SET status='suspended' WHERE id=$1").bind(user_id).execute(db).await?;
    sqlx::query("UPDATE sessions SET is_active=false WHERE user_id=$1").bind(user_id).execute(db).await?;
    sqlx::query("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)")
        .bind(Uuid::new_v4()).bind(user_id).bind("user_suspended").bind("user").bind(user_id)
        .bind(serde_json::json!({ "reason": reason })).execute(db).await?;
    Ok(())
}

pub async fn activate_user(db: &PgPool, user_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE users SET status='active' WHERE id=$1").bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn list_posts(db: &PgPool, q: AdminQuery) -> Result<serde_json::Value> {
    let offset = ((q.page.unwrap_or(1) - 1) * q.limit.unwrap_or(20)).max(0);
    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, chrono::DateTime<chrono::Utc>, String, String)>(
        "SELECT p.id, p.content, p.post_type::text, p.likes_count, p.created_at, u.username, u.full_name
         FROM posts p JOIN users u ON u.id=p.author_id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2"
    ).bind(q.limit.unwrap_or(20)).bind(offset).fetch_all(db).await?;
    Ok(serde_json::json!({ "posts": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "content": r.1, "post_type": r.2, "likes_count": r.3, "created_at": r.4,
        "author": { "username": r.5, "full_name": r.6 }
    })).collect::<Vec<_>>() }))
}

pub async fn remove_post(db: &PgPool, post_id: Uuid, admin_id: Uuid) -> Result<()> {
    sqlx::query("DELETE FROM posts WHERE id=$1").bind(post_id).execute(db).await?;
    sqlx::query("INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)")
        .bind(Uuid::new_v4()).bind(admin_id).bind("post_removed").bind("post").bind(post_id).execute(db).await?;
    Ok(())
}

pub async fn get_platform_analytics(db: &PgPool) -> Result<serde_json::Value> {
    let total_users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users").fetch_one(db).await?;
    let active_users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE status='active'").fetch_one(db).await?;
    let total_posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM posts").fetch_one(db).await?;
    let total_messages: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM messages").fetch_one(db).await?;
    let new_users_today: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE created_at > NOW()-INTERVAL '1 day'").fetch_one(db).await?;
    let total_organizations: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM organizations").fetch_one(db).await?;
    Ok(serde_json::json!({
        "total_users": total_users, "active_users": active_users, "total_posts": total_posts,
        "total_messages": total_messages, "new_users_today": new_users_today, "total_organizations": total_organizations
    }))
}

pub async fn get_audit_logs(db: &PgPool, page: i64, limit: i64) -> Result<Vec<serde_json::Value>> {
    let offset = ((page - 1) * limit).max(0);
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<Uuid>, Option<serde_json::Value>, chrono::DateTime<chrono::Utc>, Option<String>, Option<String>)>(
        "SELECT al.id, al.action, al.entity_type, al.entity_id, al.metadata, al.created_at, u.username, u.full_name
         FROM audit_logs al LEFT JOIN users u ON u.id=al.actor_id ORDER BY al.created_at DESC LIMIT $1 OFFSET $2"
    ).bind(limit).bind(offset).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "action": r.1, "entity_type": r.2, "entity_id": r.3, "metadata": r.4, "created_at": r.5,
        "actor": { "username": r.6, "full_name": r.7 }
    })).collect())
}

pub async fn get_reports(db: &PgPool) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, Uuid, String, chrono::DateTime<chrono::Utc>, Option<String>)>(
        "SELECT r.id, r.reason, r.entity_type, r.entity_id, r.status, r.created_at, u.username
         FROM reports r LEFT JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 100"
    ).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "reason": r.1, "entity_type": r.2, "entity_id": r.3, "status": r.4, "created_at": r.5, "reporter": r.6
    })).collect())
}

pub async fn system_health(db: &PgPool, redis: &ConnectionManager) -> Result<serde_json::Value> {
    let db_ok = sqlx::query_scalar::<_, i64>("SELECT 1").fetch_one(db).await.is_ok();
    let mut redis_conn = redis.clone();
    let redis_ok: bool = redis::cmd("PING").query_async::<_, String>(&mut redis_conn).await.map(|r| r == "PONG").unwrap_or(false);
    Ok(serde_json::json!({
        "database": if db_ok { "healthy" } else { "unhealthy" },
        "redis": if redis_ok { "healthy" } else { "unhealthy" },
        "status": if db_ok && redis_ok { "healthy" } else { "degraded" }
    }))
}

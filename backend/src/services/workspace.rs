use sqlx::PgPool;
use redis::{aio::ConnectionManager, AsyncCommands};
use uuid::Uuid;
use crate::api::workspace::*;
use crate::config::AppConfig;
use crate::errors::{AppError, Result};
use crate::utils::tokens;

pub async fn get_user_workspaces(db: &PgPool, user_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, i32, Option<String>, String)>(
        "SELECT o.id, o.name, o.slug, o.description, o.logo_url, o.members_count, o.industry, om.role
         FROM organizations o JOIN org_members om ON om.org_id=o.id
         WHERE om.user_id=$1 AND om.is_active=true ORDER BY o.created_at DESC"
    ).bind(user_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "name": r.1, "slug": r.2, "description": r.3,
        "logo_url": r.4, "members_count": r.5, "industry": r.6, "role": r.7
    })).collect())
}

pub async fn create_workspace(db: &PgPool, user_id: Uuid, req: CreateWorkspaceRequest) -> Result<serde_json::Value> {
    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM organizations WHERE slug=$1")
        .bind(&req.slug).fetch_one(db).await?;
    if existing > 0 { return Err(AppError::Conflict("Slug already taken".into())); }

    let org_id = Uuid::new_v4();
    sqlx::query("INSERT INTO organizations (id, name, slug, description, industry, website, size, owner_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)")
        .bind(org_id).bind(&req.name).bind(&req.slug).bind(&req.description)
        .bind(&req.industry).bind(&req.website).bind(&req.size).bind(user_id).execute(db).await?;
    sqlx::query("INSERT INTO org_members (org_id, user_id, role) VALUES ($1,$2,'owner')")
        .bind(org_id).bind(user_id).execute(db).await?;
    get_workspace(db, user_id, org_id).await
}

pub async fn get_workspace(db: &PgPool, user_id: Uuid, org_id: Uuid) -> Result<serde_json::Value> {
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM org_members WHERE org_id=$1 AND user_id=$2 AND is_active=true)"
    ).bind(org_id).bind(user_id).fetch_one(db).await?;
    if !is_member { return Err(AppError::Forbidden); }

    let row = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, i32, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, name, slug, description, logo_url, website, industry, size, members_count, created_at FROM organizations WHERE id=$1"
    ).bind(org_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("Workspace".into()))?;

    Ok(serde_json::json!({
        "id": row.0, "name": row.1, "slug": row.2, "description": row.3, "logo_url": row.4,
        "website": row.5, "industry": row.6, "size": row.7, "members_count": row.8, "created_at": row.9
    }))
}

pub async fn update_workspace(db: &PgPool, user_id: Uuid, org_id: Uuid, req: CreateWorkspaceRequest) -> Result<serde_json::Value> {
    let role: Option<String> = sqlx::query_scalar(
        "SELECT role FROM org_members WHERE org_id=$1 AND user_id=$2 AND is_active=true"
    ).bind(org_id).bind(user_id).fetch_optional(db).await?;
    if !matches!(role.as_deref(), Some("owner") | Some("admin")) { return Err(AppError::Forbidden); }
    sqlx::query("UPDATE organizations SET name=$1, description=$2, industry=$3, website=$4, size=$5, updated_at=NOW() WHERE id=$6")
        .bind(&req.name).bind(&req.description).bind(&req.industry).bind(&req.website).bind(&req.size).bind(org_id).execute(db).await?;
    get_workspace(db, user_id, org_id).await
}

pub async fn delete_workspace(db: &PgPool, user_id: Uuid, org_id: Uuid) -> Result<()> {
    let owner: Option<Uuid> = sqlx::query_scalar("SELECT owner_id FROM organizations WHERE id=$1")
        .bind(org_id).fetch_optional(db).await?;
    if owner != Some(user_id) { return Err(AppError::Forbidden); }
    sqlx::query("DELETE FROM organizations WHERE id=$1").bind(org_id).execute(db).await?;
    Ok(())
}

pub async fn get_members(db: &PgPool, user_id: Uuid, org_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM org_members WHERE org_id=$1 AND user_id=$2 AND is_active=true)"
    ).bind(org_id).bind(user_id).fetch_one(db).await?;
    if !is_member { return Err(AppError::Forbidden); }

    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, String, chrono::DateTime<chrono::Utc>)>(
        "SELECT u.id, u.username, u.full_name, u.avatar_url, u.headline, om.role, om.joined_at
         FROM org_members om JOIN users u ON u.id=om.user_id
         WHERE om.org_id=$1 AND om.is_active=true ORDER BY om.joined_at"
    ).bind(org_id).fetch_all(db).await?;
    Ok(rows.iter().map(|r| serde_json::json!({
        "id": r.0, "username": r.1, "full_name": r.2, "avatar_url": r.3, "headline": r.4, "role": r.5, "joined_at": r.6
    })).collect())
}

pub async fn invite_member(db: &PgPool, _config: &AppConfig, user_id: Uuid, org_id: Uuid, req: InviteMemberRequest) -> Result<()> {
    let role: Option<String> = sqlx::query_scalar(
        "SELECT role FROM org_members WHERE org_id=$1 AND user_id=$2 AND is_active=true"
    ).bind(org_id).bind(user_id).fetch_optional(db).await?;
    if !matches!(role.as_deref(), Some("owner") | Some("admin")) { return Err(AppError::Forbidden); }
    let token = tokens::generate_secure_token();
    sqlx::query("INSERT INTO workspace_invites (org_id, email, role, token, invited_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (org_id, email) DO UPDATE SET token=EXCLUDED.token, role=EXCLUDED.role")
        .bind(org_id).bind(&req.email).bind(&req.role).bind(&token).bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn update_member_role(db: &PgPool, user_id: Uuid, org_id: Uuid, target_id: Uuid, role: &str) -> Result<()> {
    let my_role: Option<String> = sqlx::query_scalar("SELECT role FROM org_members WHERE org_id=$1 AND user_id=$2")
        .bind(org_id).bind(user_id).fetch_optional(db).await?;
    if !matches!(my_role.as_deref(), Some("owner") | Some("admin")) { return Err(AppError::Forbidden); }
    sqlx::query("UPDATE org_members SET role=$1 WHERE org_id=$2 AND user_id=$3").bind(role).bind(org_id).bind(target_id).execute(db).await?;
    Ok(())
}

pub async fn remove_member(db: &PgPool, user_id: Uuid, org_id: Uuid, target_id: Uuid) -> Result<()> {
    let my_role: Option<String> = sqlx::query_scalar("SELECT role FROM org_members WHERE org_id=$1 AND user_id=$2")
        .bind(org_id).bind(user_id).fetch_optional(db).await?;
    if !matches!(my_role.as_deref(), Some("owner") | Some("admin")) && user_id != target_id { return Err(AppError::Forbidden); }
    sqlx::query("UPDATE org_members SET is_active=false WHERE org_id=$1 AND user_id=$2").bind(org_id).bind(target_id).execute(db).await?;
    sqlx::query("UPDATE organizations SET members_count=GREATEST(members_count-1,0) WHERE id=$1").bind(org_id).execute(db).await?;
    Ok(())
}

pub async fn generate_invite_token(_db: &PgPool, redis: &ConnectionManager, user_id: Uuid, org_id: Uuid) -> Result<String> {
    let token = tokens::generate_secure_token();
    let mut redis_conn = redis.clone();
    let _: () = redis_conn.set_ex(format!("ws_invite:{}", token), format!("{}:{}", org_id, user_id), 604800).await?;
    Ok(token)
}

pub async fn join_with_token(db: &PgPool, redis: &ConnectionManager, user_id: Uuid, token: &str) -> Result<serde_json::Value> {
    let mut redis_conn = redis.clone();
    let val: Option<String> = redis_conn.get(format!("ws_invite:{}", token)).await?;
    let val = val.ok_or_else(|| AppError::BadRequest("Invalid or expired invite".into()))?;
    let org_id: Uuid = val.split(':').next().unwrap_or("").parse()
        .map_err(|_| AppError::BadRequest("Invalid invite".into()))?;
    sqlx::query("INSERT INTO org_members (org_id, user_id, role) VALUES ($1,$2,'member') ON CONFLICT DO NOTHING")
        .bind(org_id).bind(user_id).execute(db).await?;
    sqlx::query("UPDATE organizations SET members_count=members_count+1 WHERE id=$1").bind(org_id).execute(db).await?;
    get_workspace(db, user_id, org_id).await
}

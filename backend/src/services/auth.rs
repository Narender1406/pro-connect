use sqlx::PgPool;
use redis::{aio::ConnectionManager, AsyncCommands};
use uuid::Uuid;
use chrono::Utc;
use bcrypt::{hash, verify};
use jsonwebtoken::{encode, EncodingKey, Header};
use totp_rs::{TOTP, Algorithm as TotpAlg, Secret};
use crate::api::auth::{LoginRequest, RegisterRequest};
use crate::config::AppConfig;
use crate::errors::{AppError, Result};
use crate::middleware::auth::Claims;
use crate::models::{User, UserRole, UserStatus, Session};
use crate::utils::tokens;
use super::email;

fn make_totp(secret_base32: &str) -> Result<TOTP> {
    TOTP::new(
        TotpAlg::SHA1, 6, 1, 30,
        Secret::Encoded(secret_base32.to_string()).to_bytes()
            .map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))?,
    ).map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))
}

pub async fn register(
    db: &PgPool,
    redis: &ConnectionManager,
    config: &AppConfig,
    req: RegisterRequest,
    ip: Option<String>,
) -> Result<serde_json::Value> {
    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE email=$1 OR username=$2")
        .bind(&req.email).bind(&req.username)
        .fetch_one(db).await?;
    if existing > 0 {
        return Err(AppError::Conflict("Email or username already taken".into()));
    }

    let pw_hash = hash(&req.password, config.bcrypt_cost)
        .map_err(|e| AppError::Internal(e.into()))?;
    let user_id = Uuid::new_v4();
    let verification_token = tokens::generate_secure_token();

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, username, full_name, role, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'user', 'pending_verification', false)"
    )
    .bind(user_id).bind(&req.email).bind(&pw_hash)
    .bind(&req.username).bind(&req.full_name)
    .execute(db).await?;

    sqlx::query("INSERT INTO user_profiles (id, user_id) VALUES ($1, $2)")
        .bind(Uuid::new_v4()).bind(user_id)
        .execute(db).await?;

    let mut redis_conn = redis.clone();
    let _: () = redis_conn.set_ex(
        format!("verify_email:{}", verification_token),
        user_id.to_string(),
        86400,
    ).await?;

    email::send_verification_email(config, &req.email, &req.full_name, &verification_token).await
        .unwrap_or_else(|e| tracing::warn!("Failed to send verification email: {}", e));

    Ok(serde_json::json!({
        "id": user_id,
        "email": req.email,
        "username": req.username,
        "full_name": req.full_name
    }))
}

pub async fn login(
    db: &PgPool,
    redis: &ConnectionManager,
    config: &AppConfig,
    req: LoginRequest,
    ip: Option<String>,
    ua: Option<String>,
) -> Result<serde_json::Value> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email=$1")
        .bind(&req.email).fetch_optional(db).await?
        .ok_or(AppError::Unauthorized)?;

    if user.status == UserStatus::Suspended {
        return Err(AppError::Forbidden);
    }

    let valid = verify(&req.password, &user.password_hash)
        .map_err(|e| AppError::Internal(e.into()))?;
    if !valid {
        return Err(AppError::Unauthorized);
    }

    if user.two_factor_enabled {
        let code = req.totp_code.ok_or_else(|| AppError::BadRequest("2FA code required".into()))?;
        let secret = user.two_factor_secret.as_ref()
            .ok_or_else(|| AppError::Internal(anyhow::anyhow!("2FA secret missing")))?;
        let totp = make_totp(secret)?;
        if !totp.check_current(&code).map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))? {
            return Err(AppError::Unauthorized);
        }
    }

    let (access_token, refresh_token, _session_id) =
        create_session(db, config, &user, ip, ua, req.device_name).await?;

    sqlx::query("UPDATE users SET last_seen_at=NOW() WHERE id=$1")
        .bind(user.id).execute(db).await?;

    Ok(serde_json::json!({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in": config.jwt_expiry_seconds,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "avatar_url": user.avatar_url,
            "email_verified": user.email_verified,
        }
    }))
}

async fn create_session(
    db: &PgPool,
    config: &AppConfig,
    user: &User,
    ip: Option<String>,
    ua: Option<String>,
    device_name: Option<String>,
) -> Result<(String, String, Uuid)> {
    let session_id = Uuid::new_v4();
    let now = Utc::now();
    let refresh_token_raw = tokens::generate_secure_token();
    let refresh_hash = tokens::hash_token(&refresh_token_raw);

    let access_claims = Claims {
        sub: user.id,
        role: user.role.clone(),
        session_id,
        exp: (now + chrono::Duration::seconds(config.jwt_expiry_seconds)).timestamp(),
        iat: now.timestamp(),
        token_type: "access".into(),
    };

    let access_token = encode(
        &Header::default(),
        &access_claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    ).map_err(|e| AppError::Internal(e.into()))?;

    let device_type = ua.as_deref()
        .map(|u| if u.contains("Mobile") { "mobile" } else { "desktop" })
        .map(String::from);

    sqlx::query(
        "INSERT INTO sessions (id, user_id, refresh_token_hash, device_name, device_type, ip_address, user_agent, is_active, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)"
    )
    .bind(session_id).bind(user.id).bind(&refresh_hash)
    .bind(&device_name).bind(&device_type).bind(&ip).bind(&ua)
    .bind(now + chrono::Duration::seconds(config.refresh_expiry_seconds))
    .execute(db).await?;

    Ok((access_token, refresh_token_raw, session_id))
}

pub async fn logout(
    db: &PgPool,
    _redis: &ConnectionManager,
    user_id: Uuid,
    refresh_token: &str,
) -> Result<()> {
    let hash = tokens::hash_token(refresh_token);
    sqlx::query("UPDATE sessions SET is_active=false WHERE user_id=$1 AND refresh_token_hash=$2")
        .bind(user_id).bind(&hash).execute(db).await?;
    Ok(())
}

pub async fn refresh_token(
    db: &PgPool,
    _redis: &ConnectionManager,
    config: &AppConfig,
    refresh_token: &str,
    ip: Option<String>,
    ua: Option<String>,
) -> Result<serde_json::Value> {
    let hash = tokens::hash_token(refresh_token);
    let session = sqlx::query_as::<_, Session>(
        "SELECT * FROM sessions WHERE refresh_token_hash=$1 AND is_active=true AND expires_at > NOW()"
    )
    .bind(&hash).fetch_optional(db).await?
    .ok_or(AppError::Unauthorized)?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id=$1")
        .bind(session.user_id).fetch_optional(db).await?
        .ok_or(AppError::Unauthorized)?;

    let (access_token, new_refresh, _) =
        create_session(db, config, &user, ip, ua, session.device_name).await?;

    sqlx::query("UPDATE sessions SET is_active=false WHERE id=$1")
        .bind(session.id).execute(db).await?;

    Ok(serde_json::json!({
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "Bearer",
        "expires_in": config.jwt_expiry_seconds
    }))
}

pub async fn verify_email(
    db: &PgPool,
    redis: &ConnectionManager,
    token: &str,
) -> Result<()> {
    let mut redis_conn = redis.clone();
    let key = format!("verify_email:{}", token);
    let user_id_str: Option<String> = redis_conn.get(&key).await?;
    let user_id_str = user_id_str.ok_or_else(|| AppError::BadRequest("Invalid or expired token".into()))?;
    let user_id: Uuid = user_id_str.parse().map_err(|_| AppError::BadRequest("Invalid token".into()))?;

    sqlx::query("UPDATE users SET email_verified=true, status='active' WHERE id=$1")
        .bind(user_id).execute(db).await?;
    let _: () = redis_conn.del(&key).await?;
    Ok(())
}

pub async fn forgot_password(
    db: &PgPool,
    redis: &ConnectionManager,
    config: &AppConfig,
    email: &str,
) -> Result<()> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email=$1")
        .bind(email).fetch_optional(db).await?;

    if let Some(user) = user {
        let token = tokens::generate_secure_token();
        let mut redis_conn = redis.clone();
        let _: () = redis_conn.set_ex(format!("pwd_reset:{}", token), user.id.to_string(), 3600).await?;
        email::send_password_reset_email(config, &user.email, &user.full_name, &token).await
            .unwrap_or_else(|e| tracing::warn!("Failed to send reset email: {}", e));
    }
    Ok(())
}

pub async fn reset_password(
    db: &PgPool,
    redis: &ConnectionManager,
    config: &AppConfig,
    token: &str,
    new_password: &str,
) -> Result<()> {
    let mut redis_conn = redis.clone();
    let key = format!("pwd_reset:{}", token);
    let user_id_str: Option<String> = redis_conn.get(&key).await?;
    let user_id_str = user_id_str.ok_or_else(|| AppError::BadRequest("Invalid or expired token".into()))?;
    let user_id: Uuid = user_id_str.parse().map_err(|_| AppError::BadRequest("Invalid token".into()))?;

    let pw_hash = hash(new_password, config.bcrypt_cost).map_err(|e| AppError::Internal(e.into()))?;
    sqlx::query("UPDATE users SET password_hash=$1 WHERE id=$2")
        .bind(&pw_hash).bind(user_id).execute(db).await?;
    sqlx::query("UPDATE sessions SET is_active=false WHERE user_id=$1").bind(user_id).execute(db).await?;
    let _: () = redis_conn.del(&key).await?;
    Ok(())
}

pub async fn setup_2fa(db: &PgPool, user_id: Uuid) -> Result<serde_json::Value> {
    let secret = Secret::generate_secret();
    let secret_base32 = secret.to_encoded().to_string();

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id=$1")
        .bind(user_id).fetch_one(db).await?;

    sqlx::query("UPDATE users SET two_factor_secret=$1 WHERE id=$2")
        .bind(&secret_base32).bind(user_id).execute(db).await?;

    let totp = TOTP::new(
        TotpAlg::SHA1, 6, 1, 30,
        Secret::Encoded(secret_base32.clone()).to_bytes()
            .map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))?,
    ).map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))?;
    let otpauth = format!("otpauth://totp/CareerTrack:{}?secret={}&issuer=CareerTrack", user.email, secret_base32);

    Ok(serde_json::json!({
        "secret": secret_base32,
        "otpauth_url": otpauth
    }))
}

pub async fn enable_2fa(db: &PgPool, user_id: Uuid, code: &str) -> Result<()> {
    let secret: Option<String> = sqlx::query_scalar("SELECT two_factor_secret FROM users WHERE id=$1")
        .bind(user_id).fetch_one(db).await?;
    let secret = secret.ok_or_else(|| AppError::BadRequest("2FA not set up".into()))?;

    let totp = make_totp(&secret)?;
    if !totp.check_current(code).map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))? {
        return Err(AppError::BadRequest("Invalid 2FA code".into()));
    }

    sqlx::query("UPDATE users SET two_factor_enabled=true WHERE id=$1")
        .bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn disable_2fa(db: &PgPool, user_id: Uuid, code: &str) -> Result<()> {
    let secret: Option<String> = sqlx::query_scalar("SELECT two_factor_secret FROM users WHERE id=$1")
        .bind(user_id).fetch_one(db).await?;
    let secret = secret.ok_or_else(|| AppError::BadRequest("2FA not enabled".into()))?;

    let totp = make_totp(&secret)?;
    if !totp.check_current(code).map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))? {
        return Err(AppError::BadRequest("Invalid 2FA code".into()));
    }

    sqlx::query("UPDATE users SET two_factor_enabled=false, two_factor_secret=NULL WHERE id=$1")
        .bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn get_sessions(db: &PgPool, user_id: Uuid) -> Result<Vec<serde_json::Value>> {
    let sessions = sqlx::query_as::<_, Session>(
        "SELECT * FROM sessions WHERE user_id=$1 AND is_active=true ORDER BY last_used_at DESC"
    ).bind(user_id).fetch_all(db).await?;

    Ok(sessions.iter().map(|s| serde_json::json!({
        "id": s.id,
        "device_name": s.device_name,
        "device_type": s.device_type,
        "ip_address": s.ip_address,
        "created_at": s.created_at,
        "last_used_at": s.last_used_at,
    })).collect())
}

pub async fn revoke_session(db: &PgPool, user_id: Uuid, session_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE sessions SET is_active=false WHERE id=$1 AND user_id=$2")
        .bind(session_id).bind(user_id).execute(db).await?;
    Ok(())
}

pub async fn get_me(db: &PgPool, user_id: Uuid) -> Result<serde_json::Value> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id=$1")
        .bind(user_id).fetch_optional(db).await?
        .ok_or_else(|| AppError::NotFound("User".into()))?;

    Ok(serde_json::json!({
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "status": user.status,
        "avatar_url": user.avatar_url,
        "cover_url": user.cover_url,
        "bio": user.bio,
        "headline": user.headline,
        "location": user.location,
        "website": user.website,
        "github_username": user.github_username,
        "linkedin_url": user.linkedin_url,
        "open_to_work": user.open_to_work,
        "email_verified": user.email_verified,
        "two_factor_enabled": user.two_factor_enabled,
        "followers_count": user.followers_count,
        "following_count": user.following_count,
        "posts_count": user.posts_count,
        "created_at": user.created_at,
    }))
}

pub async fn change_password(
    db: &PgPool,
    config: &AppConfig,
    user_id: Uuid,
    current: &str,
    new: &str,
) -> Result<()> {
    let pw_hash: String = sqlx::query_scalar("SELECT password_hash FROM users WHERE id=$1")
        .bind(user_id).fetch_one(db).await?;

    let valid = verify(current, &pw_hash).map_err(|e| AppError::Internal(e.into()))?;
    if !valid { return Err(AppError::BadRequest("Current password incorrect".into())); }

    let new_hash = hash(new, config.bcrypt_cost).map_err(|e| AppError::Internal(e.into()))?;
    sqlx::query("UPDATE users SET password_hash=$1 WHERE id=$2").bind(&new_hash).bind(user_id).execute(db).await?;
    sqlx::query("UPDATE sessions SET is_active=false WHERE user_id=$1").bind(user_id).execute(db).await?;
    Ok(())
}

use sqlx::PgPool;
use uuid::Uuid;
use axum::extract::Multipart;
use crate::api::files::FileQuery;
use crate::config::AppConfig;
use crate::errors::{AppError, Result};

pub async fn upload_file(db: &PgPool, config: &AppConfig, user_id: Uuid, mut multipart: Multipart) -> Result<serde_json::Value> {
    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        let filename = field.file_name().unwrap_or("file").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
        let data = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
        if data.len() > (config.max_file_size_mb * 1024 * 1024) as usize {
            return Err(AppError::BadRequest(format!("File too large. Max {}MB", config.max_file_size_mb)));
        }
        let file_id = Uuid::new_v4();
        let ext = std::path::Path::new(&filename).extension().and_then(|e| e.to_str()).unwrap_or("bin");
        let key = format!("files/{}/{}.{}", user_id, file_id, ext);
        let url = format!("https://{}.s3.{}.amazonaws.com/{}", config.s3_bucket, config.s3_region, key);
        let file_type = if content_type.starts_with("image/") { "image" }
            else if content_type.starts_with("video/") { "video" }
            else if content_type == "application/pdf" { "document" }
            else { "file" };
        sqlx::query(
            "INSERT INTO files (id, user_id, filename, url, content_type, file_type, size_bytes, storage_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"
        ).bind(file_id).bind(user_id).bind(&filename).bind(&url)
        .bind(&content_type).bind(file_type).bind(data.len() as i64).bind(&key).execute(db).await?;
        return Ok(serde_json::json!({
            "id": file_id, "filename": filename, "url": url,
            "content_type": content_type, "file_type": file_type, "size_bytes": data.len()
        }));
    }
    Err(AppError::BadRequest("No file provided".into()))
}

pub async fn get_file(db: &PgPool, file_id: Uuid) -> Result<serde_json::Value> {
    let row = sqlx::query_as::<_, (Uuid, String, String, String, String, i64, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, filename, url, content_type, file_type, size_bytes, created_at FROM files WHERE id=$1"
    ).bind(file_id).fetch_optional(db).await?.ok_or_else(|| AppError::NotFound("File".into()))?;
    Ok(serde_json::json!({
        "id": row.0, "filename": row.1, "url": row.2, "content_type": row.3,
        "file_type": row.4, "size_bytes": row.5, "created_at": row.6
    }))
}

pub async fn delete_file(db: &PgPool, _config: &AppConfig, user_id: Uuid, file_id: Uuid) -> Result<()> {
    let rows = sqlx::query("DELETE FROM files WHERE id=$1 AND user_id=$2").bind(file_id).bind(user_id).execute(db).await?.rows_affected();
    if rows == 0 { return Err(AppError::Forbidden); }
    Ok(())
}

pub async fn list_files(db: &PgPool, user_id: Uuid, q: FileQuery) -> Result<serde_json::Value> {
    let offset = ((q.page.unwrap_or(1) - 1) * q.limit.unwrap_or(20)).max(0);
    let rows = sqlx::query_as::<_, (Uuid, String, String, String, String, i64, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, filename, url, content_type, file_type, size_bytes, created_at FROM files WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    ).bind(user_id).bind(q.limit.unwrap_or(20)).bind(offset).fetch_all(db).await?;
    Ok(serde_json::json!({ "files": rows.iter().map(|r| serde_json::json!({
        "id": r.0, "filename": r.1, "url": r.2, "content_type": r.3, "file_type": r.4, "size_bytes": r.5, "created_at": r.6
    })).collect::<Vec<_>>() }))
}

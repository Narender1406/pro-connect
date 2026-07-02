use serde::Deserialize;
use anyhow::Context;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub jwt_refresh_secret: String,
    pub jwt_expiry_seconds: i64,
    pub refresh_expiry_seconds: i64,
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_pass: String,
    pub smtp_from: String,
    pub frontend_url: String,
    pub allowed_origins: Vec<String>,
    pub s3_bucket: String,
    pub s3_region: String,
    pub aws_access_key_id: String,
    pub aws_secret_access_key: String,
    pub max_file_size_mb: u64,
    pub bcrypt_cost: u32,
    pub rate_limit_requests: u64,
    pub rate_limit_window_secs: u64,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            port: std::env::var("PORT").unwrap_or_else(|_| "8080".into()).parse()?,
            database_url: std::env::var("DATABASE_URL").context("DATABASE_URL required")?,
            redis_url: std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".into()),
            jwt_secret: std::env::var("JWT_SECRET").context("JWT_SECRET required")?,
            jwt_refresh_secret: std::env::var("JWT_REFRESH_SECRET").context("JWT_REFRESH_SECRET required")?,
            jwt_expiry_seconds: std::env::var("JWT_EXPIRY_SECONDS").unwrap_or_else(|_| "900".into()).parse()?,
            refresh_expiry_seconds: std::env::var("REFRESH_EXPIRY_SECONDS").unwrap_or_else(|_| "2592000".into()).parse()?,
            smtp_host: std::env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".into()),
            smtp_port: std::env::var("SMTP_PORT").unwrap_or_else(|_| "587".into()).parse()?,
            smtp_user: std::env::var("SMTP_USER").unwrap_or_default(),
            smtp_pass: std::env::var("SMTP_PASS").unwrap_or_default(),
            smtp_from: std::env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@careertrack.dev".into()),
            frontend_url: std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".into()),
            allowed_origins: std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".into())
                .split(',').map(String::from).collect(),
            s3_bucket: std::env::var("S3_BUCKET").unwrap_or_else(|_| "careertrack-files".into()),
            s3_region: std::env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".into()),
            aws_access_key_id: std::env::var("AWS_ACCESS_KEY_ID").unwrap_or_default(),
            aws_secret_access_key: std::env::var("AWS_SECRET_ACCESS_KEY").unwrap_or_default(),
            max_file_size_mb: std::env::var("MAX_FILE_SIZE_MB").unwrap_or_else(|_| "50".into()).parse()?,
            bcrypt_cost: std::env::var("BCRYPT_COST").unwrap_or_else(|_| "12".into()).parse()?,
            rate_limit_requests: std::env::var("RATE_LIMIT_REQUESTS").unwrap_or_else(|_| "100".into()).parse()?,
            rate_limit_window_secs: std::env::var("RATE_LIMIT_WINDOW_SECS").unwrap_or_else(|_| "60".into()).parse()?,
        })
    }
}

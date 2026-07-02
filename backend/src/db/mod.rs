use sqlx::{PgPool, postgres::PgPoolOptions};
use redis::{Client as RedisClient, aio::ConnectionManager};
use std::time::Duration;

pub async fn create_pool(url: &str) -> anyhow::Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(url)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to connect to PostgreSQL: {}", e))
}

pub async fn create_redis(url: &str) -> anyhow::Result<ConnectionManager> {
    let client = RedisClient::open(url)?;
    ConnectionManager::new(client).await
        .map_err(|e| anyhow::anyhow!("Failed to connect to Redis: {}", e))
}

pub async fn run_migrations(pool: &PgPool) -> anyhow::Result<()> {
    sqlx::migrate!("./migrations").run(pool).await?;
    tracing::info!("Database migrations completed");
    Ok(())
}

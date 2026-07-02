use axum::{extract::Request, middleware::Next, response::Response};
use redis::{aio::ConnectionManager, AsyncCommands};
use crate::errors::AppError;

pub async fn rate_limit_middleware(
    mut redis: ConnectionManager,
    key: String,
    limit: u64,
    window_secs: u64,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let count: u64 = redis.incr(&key, 1).await.unwrap_or(0);
    if count == 1 {
        let _: () = redis.expire(&key, window_secs as i64).await.unwrap_or(());
    }
    if count > limit {
        return Err(AppError::RateLimited);
    }
    Ok(next.run(request).await)
}

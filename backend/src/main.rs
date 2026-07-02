use axum::Router;
use axum::http::{Method, header::{AUTHORIZATION, CONTENT_TYPE}};
use std::net::SocketAddr;
use tower_http::{cors::CorsLayer, trace::TraceLayer, compression::CompressionLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod config;
mod db;
mod errors;
mod middleware;
mod models;
mod services;
mod utils;
mod websocket;

pub use errors::{AppError, Result};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "careertrack=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    let cfg = config::AppConfig::from_env()?;
    let db_pool = db::create_pool(&cfg.database_url).await?;
    let redis_client = db::create_redis(&cfg.redis_url).await?;

    db::run_migrations(&db_pool).await?;

    let state = api::AppState::new(db_pool, redis_client, cfg.clone());

    let app = Router::new()
        .nest("/api/v1", api::routes(state.clone()))
        .nest("/ws", websocket::routes(state))
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(
            CorsLayer::new()
                .allow_origin(cfg.allowed_origins.iter()
                    .map(|o| o.parse().unwrap())
                    .collect::<Vec<_>>())
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::PATCH, Method::DELETE])
                .allow_headers([AUTHORIZATION, CONTENT_TYPE])
                .allow_credentials(true)
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], cfg.port));
    tracing::info!("CareerTrack server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

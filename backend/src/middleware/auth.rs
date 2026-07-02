use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
};
use axum_extra::{
    headers::{Authorization, authorization::Bearer},
    TypedHeader,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::api::AppState;
use crate::errors::AppError;
use crate::models::UserRole;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub role: UserRole,
    pub session_id: Uuid,
    pub exp: i64,
    pub iat: i64,
    pub token_type: String,
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub role: UserRole,
    pub session_id: Uuid,
}

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) =
            TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state)
                .await
                .map_err(|_| AppError::Unauthorized)?;

        let claims = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|_| AppError::Unauthorized)?
        .claims;

        if claims.token_type != "access" {
            return Err(AppError::Unauthorized);
        }

        Ok(AuthUser {
            user_id: claims.sub,
            role: claims.role,
            session_id: claims.session_id,
        })
    }
}

// Manual optional extractor — avoids conflict with axum's blanket impl
pub struct OptionalAuth(pub Option<AuthUser>);

#[async_trait]
impl FromRequestParts<AppState> for OptionalAuth {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        Ok(OptionalAuth(AuthUser::from_request_parts(parts, state).await.ok()))
    }
}

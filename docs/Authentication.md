# Authentication Guide

## Overview

CareerTrack uses a dual-token JWT authentication system with optional TOTP-based 2FA.

## Token Flow

```
1. POST /auth/login → { access_token, refresh_token, expires_in: 900 }
2. All requests: Authorization: Bearer <access_token>
3. access_token expires in 15 minutes (configurable)
4. POST /auth/refresh → { new access_token, new refresh_token }
5. Refresh tokens rotate on every use (prevents replay attacks)
6. POST /auth/logout → revokes current session
```

## JWT Claims

```json
{
  "sub": "user-uuid",
  "role": "user",
  "session_id": "session-uuid",
  "exp": 1700000000,
  "iat": 1699999100,
  "token_type": "access"
}
```

## Password Security

- Bcrypt hashing with cost factor 12 (configurable)
- Minimum 8 characters enforced at API level
- Password reset tokens stored hashed in Redis with 1-hour TTL
- All sessions invalidated on password change

## Email Verification

1. Registration creates user with status `pending_verification`
2. Verification token (32-byte hex) stored in Redis with 24h TTL
3. GET /auth/verify-email/:token → sets status `active`

## Two-Factor Authentication (TOTP)

1. POST /auth/2fa/setup → returns TOTP secret + otpauth URL
2. Scan QR with authenticator app (Google Authenticator, Authy)
3. POST /auth/2fa/verify with 6-digit code → enables 2FA
4. Login with 2FA: POST /auth/login with `totp_code` field

## Session Management

- Each login creates a session record with device info
- GET /auth/sessions → list all active sessions
- DELETE /auth/sessions/:id → revoke specific session
- Sessions auto-expire at `refresh_expiry_seconds`

## Rate Limiting

- Login endpoint: 10 requests/minute per IP
- Registration: 5 requests/minute per IP
- General API: 100 requests/minute per user

## Security Headers

Nginx adds:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

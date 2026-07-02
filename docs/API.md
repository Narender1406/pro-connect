# API Reference

Base URL: `https://api.careertrack.dev/api/v1`

All authenticated endpoints require: `Authorization: Bearer <access_token>`

## Authentication `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | — | Register new account |
| POST | /auth/login | — | Login, returns tokens |
| POST | /auth/logout | ✓ | Invalidate session |
| POST | /auth/refresh | — | Refresh access token |
| GET | /auth/verify-email/:token | — | Verify email address |
| POST | /auth/forgot-password | — | Send reset email |
| POST | /auth/reset-password | — | Reset password with token |
| POST | /auth/2fa/setup | ✓ | Get 2FA QR code |
| POST | /auth/2fa/verify | ✓ | Enable 2FA |
| POST | /auth/2fa/disable | ✓ | Disable 2FA |
| GET | /auth/sessions | ✓ | List active sessions |
| DELETE | /auth/sessions/:id | ✓ | Revoke session |
| GET | /auth/me | ✓ | Get current user |
| PUT | /auth/change-password | ✓ | Change password |

## Users `/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /users | — | Search users |
| GET | /users/:id | — | Get user profile |
| PUT | /users/me/profile | ✓ | Update profile |
| POST | /users/me/avatar | ✓ | Upload avatar |
| POST | /users/me/cover | ✓ | Upload cover image |
| POST | /users/me/resume | ✓ | Upload resume PDF |
| POST | /users/:id/follow | ✓ | Follow user |
| DELETE | /users/:id/unfollow | ✓ | Unfollow user |
| GET | /users/:id/followers | — | List followers |
| GET | /users/:id/following | — | List following |
| GET | /users/suggestions | ✓ | Suggested users |
| GET | /users/trending | — | Trending profiles |

## Posts `/posts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /posts | — | Get public feed |
| POST | /posts | ✓ | Create post |
| GET | /posts/:id | — | Get single post |
| PUT | /posts/:id | ✓ | Update post |
| DELETE | /posts/:id | ✓ | Delete post |
| POST | /posts/:id/like | ✓ | Like post |
| DELETE | /posts/:id/like | ✓ | Unlike post |
| POST | /posts/:id/save | ✓ | Save post |
| DELETE | /posts/:id/save | ✓ | Unsave post |
| GET | /posts/:id/comments | — | Get comments |
| POST | /posts/:id/comments | ✓ | Add comment |
| GET | /posts/trending | — | Trending posts |
| GET | /posts/hashtag/:tag | — | Posts by hashtag |

## Chat `/chat`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /chat/conversations | ✓ | List conversations |
| POST | /chat/conversations | ✓ | Create conversation |
| GET | /chat/conversations/:id | ✓ | Get conversation |
| GET | /chat/conversations/:id/messages | ✓ | Get messages |
| POST | /chat/conversations/:id/messages | ✓ | Send message |
| PUT | /chat/conversations/:id/messages/:msg_id | ✓ | Edit message |
| DELETE | /chat/conversations/:id/messages/:msg_id | ✓ | Delete message |
| POST | /chat/conversations/:id/read | ✓ | Mark as read |

## WebSocket `/ws`

Connect: `ws://localhost:8080/ws?token=<access_token>`

### Client → Server Events
```json
{"type": "typing_start", "conversation_id": "uuid"}
{"type": "typing_stop", "conversation_id": "uuid"}
{"type": "join_conversation", "conversation_id": "uuid"}
```

### Server → Client Events
```json
{"event": "NewMessage", "data": {...}}
{"event": "TypingStart", "data": {"conversation_id": "uuid", "user_id": "uuid"}}
{"event": "UserOnline", "data": {"user_id": "uuid"}}
{"event": "Notification", "data": {...}}
{"event": "PostLiked", "data": {"post_id": "uuid", "likes_count": 42}}
```

## Analytics `/analytics`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /analytics/me?period=30d | ✓ | Personal analytics |
| GET | /analytics/workspace/:id | ✓ | Workspace analytics |
| GET | /analytics/engagement | ✓ | Engagement summary |

## Admin `/admin`

All admin endpoints require `role: admin` or `super_admin`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/users | List all users |
| PUT | /admin/users/:id | Update user |
| POST | /admin/users/:id/suspend | Suspend user |
| DELETE | /admin/posts/:id | Remove post |
| GET | /admin/analytics | Platform metrics |
| GET | /admin/audit-logs | Audit trail |
| GET | /admin/system/health | Health check |

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}
```

| HTTP Status | Code |
|-------------|------|
| 400 | BAD_REQUEST / VALIDATION_ERROR |
| 401 | UNAUTHORIZED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | CONFLICT |
| 429 | RATE_LIMITED |
| 500 | INTERNAL_ERROR |

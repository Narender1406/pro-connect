# Security Policy

## Implemented Security Measures

### Authentication & Authorization
- JWT access tokens (15min TTL) + rotating refresh tokens (30 days)
- Bcrypt password hashing (cost 12)
- TOTP-based two-factor authentication
- Email verification required before activation
- Session-based device management
- Role-Based Access Control (user/moderator/admin/super_admin)

### Input Validation
- All inputs validated at API layer using `validator` crate
- SQL injection prevention via SQLx parameterized queries only
- File upload type and size validation
- Username/email format enforcement

### Transport Security
- HTTPS enforced in production via Nginx
- HSTS header with 1-year max-age
- Secure, HttpOnly, SameSite cookies for future cookie-based flows

### API Security
- Rate limiting per IP/user via Redis counters
- CORS configured with explicit allowed origins
- Request size limits enforced
- Authorization header required for all protected endpoints

### Data Security
- Passwords never logged or returned in responses
- 2FA secrets stored encrypted
- Refresh tokens stored as SHA-256 hashes only
- Sensitive fields use `#[serde(skip_serializing)]`

### Audit Trail
- All admin actions logged to `audit_logs` table
- User suspensions recorded with reason and actor
- Content removals tracked

## Vulnerability Reporting

Report security vulnerabilities to: security@careertrack.dev

Please do NOT open public GitHub issues for security vulnerabilities.

#!/usr/bin/env bash
# Generate a production-ready .env with secure random secrets
set -e

generate_secret() {
  openssl rand -hex 32
}

JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
POSTGRES_PASSWORD=$(generate_secret | head -c 24)
GRAFANA_PASSWORD=$(generate_secret | head -c 16)

cat > .env.production <<EOF
PORT=8080
RUST_LOG=info

# Database
DATABASE_URL=postgresql://careertrack:${POSTGRES_PASSWORD}@postgres:5432/careertrack
POSTGRES_USER=careertrack
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=careertrack

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets (auto-generated — keep secret!)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRY_SECONDS=900
REFRESH_EXPIRY_SECONDS=2592000

# Email (configure your SMTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourapp.com

# Frontend
FRONTEND_URL=https://yourapp.com
ALLOWED_ORIGINS=https://yourapp.com

# S3/MinIO Storage
S3_BUCKET=careertrack-files
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}

# Limits
MAX_FILE_SIZE_MB=50
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECS=60
EOF

echo "[generate-secrets] .env.production created with secure secrets!"
echo "[generate-secrets] Review and update SMTP and S3 credentials before deploying."

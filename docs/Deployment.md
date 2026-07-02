# Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

## Local Development

```bash
# 1. Clone and configure
git clone https://github.com/yourname/careertrack.git
cd careertrack
cp .env.example .env
# Edit .env with your secrets

# 2. Start all services
docker compose up -d

# 3. Run migrations
docker compose exec backend ./careertrack migrate

# Frontend dev server
cd frontend && npm install && npm run dev

# Backend dev server
cd backend && cargo run
```

Services available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432
- Redis: localhost:6379
- MailHog (email): http://localhost:8025

## Production Deployment

### 1. Server Setup (Ubuntu 22.04)

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
```

### 2. SSL Certificate

```bash
certbot --nginx -d careertrack.dev -d api.careertrack.dev
```

### 3. Environment Variables

```bash
cp .env.example .env
# Set production values:
# - Strong JWT_SECRET (minimum 64 chars)
# - Real SMTP credentials
# - AWS S3 credentials
# - POSTGRES strong password
```

### 4. Deploy

```bash
docker compose -f docker-compose.yml up -d --build
```

### 5. Health Check

```bash
curl https://api.careertrack.dev/api/v1/admin/system/health
```

## Scaling

### Horizontal Backend Scaling

The backend is stateless (Redis for sessions). Run multiple instances behind load balancer.
WebSocket connections use Redis pub/sub for cross-instance broadcasting.

### Database Connection Pooling

PgBouncer recommended for production with `max_connections` tuning.

### CDN

Configure CloudFront or Cloudflare in front of S3 for file serving.

## Monitoring

- Logs: `docker compose logs -f backend`
- Metrics: Prometheus endpoint at `/metrics` (configure separately)
- Health: `GET /api/v1/admin/system/health`

## Backups

```bash
# Database backup
docker compose exec postgres pg_dump -U careertrack careertrack > backup.sql

# Restore
docker compose exec -T postgres psql -U careertrack careertrack < backup.sql
```

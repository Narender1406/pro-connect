# CareerTrack

A full-stack professional networking and project management platform — built to demonstrate production-grade engineering across the entire stack.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State | Redux Toolkit + TanStack Query |
| Backend | Rust, Axum, Tokio |
| Database | PostgreSQL (SQLx) |
| Cache | Redis |
| Real-time | Native WebSockets |
| Storage | S3-compatible (MinIO for local dev) |
| DevOps | Docker, Docker Compose, GitHub Actions, Nginx |

## Features

### Authentication & Security
- JWT access tokens (15 min) + rotating refresh tokens (30 days)
- Two-factor authentication (TOTP) with QR code setup
- Email verification flow
- Device session management
- Role-based access control (user/moderator/admin/super_admin)
- Bcrypt password hashing, rate limiting, audit logging

### Social Feed
- Rich post creation (text, images, articles, job posts, polls)
- Real-time likes, comments, and shares
- Hashtag and mention support
- Infinite scroll with optimistic updates
- Trending posts and user suggestions

### Real-time Chat
- Direct and group messaging
- WebSocket-powered typing indicators and read receipts
- Message reactions (emoji)
- Message edit and delete
- Message search

### Project Management (Kanban)
- Workspace and team management
- Multi-project support
- Drag-and-drop Kanban board (todo → in_progress → in_review → done)
- Task assignments, priorities, labels, due dates
- Task comments and activity logs

### Analytics Dashboard
- Profile view tracking
- Post engagement metrics
- Follower growth
- Workspace analytics (task completion rates)

### AI Assistant
- Conversational AI chat
- Post writing assistant
- Resume review with scoring
- Meeting summary generator
- Task suggestions from project description

### Admin Panel
- User management (suspend, activate, role management)
- Content moderation
- Platform analytics
- Audit log trail
- System health monitoring

## Quick Start

```bash
# Prerequisites: Docker, Docker Compose

git clone https://github.com/yourname/careertrack.git
cd careertrack

# Configure environment
cp .env.example .env
# Edit .env — update JWT_SECRET and other secrets

# Start all services
docker compose up -d

# The app will be available at:
# Frontend: http://localhost:3000
# API:      http://localhost:8080
# MailHog:  http://localhost:8025
```

## Development

```bash
# Backend (requires Rust 1.75+)
cd backend
cargo run

# Frontend (requires Node 20+)
cd frontend
npm install
npm run dev
```

## Project Structure

```
careertrack/
├── backend/              # Rust + Axum API
│   ├── src/
│   │   ├── api/          # Route handlers (auth, users, posts, chat, ...)
│   │   ├── services/     # Business logic layer
│   │   ├── models/       # Database models
│   │   ├── middleware/   # Auth, rate limiting
│   │   ├── websocket/    # Real-time WebSocket hub
│   │   ├── utils/        # Tokens, pagination
│   │   └── main.rs
│   └── migrations/       # SQL migrations
├── frontend/             # React + TypeScript SPA
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level page components
│       ├── services/     # API client services
│       ├── store/        # Redux state slices
│       ├── hooks/        # Custom React hooks
│       └── types/        # TypeScript interfaces
├── docker/               # Nginx configuration
├── docs/                 # Architecture, API, Auth, Database docs
└── .github/workflows/    # CI/CD pipeline
```

## API Documentation

See [docs/API.md](docs/API.md) for the full API reference.

Base URL: `http://localhost:8080/api/v1`

## Documentation

- [Architecture](docs/Architecture.md)
- [Database Schema](docs/Database.md)
- [API Reference](docs/API.md)
- [Authentication](docs/Authentication.md)
- [Deployment](docs/Deployment.md)
- [Security](docs/Security.md)
- [Performance](docs/Performance.md)
- [Contributing](docs/Contributing.md)

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. Backend lint (rustfmt + clippy)
2. Backend tests with PostgreSQL + Redis
3. Frontend type check + ESLint
4. Frontend production build
5. Docker image build and push to GHCR
6. Deploy to production via SSH (on `main` branch push)

## License

MIT

# CareerTrack — Architecture

## Overview

CareerTrack is a full-stack professional networking and project management platform built with a Rust/Axum backend and a React/TypeScript frontend.

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx                            │
│            (Reverse Proxy + Static Files)               │
└──────────────┬────────────────────┬─────────────────────┘
               │                    │
       ┌───────▼──────┐    ┌────────▼────────┐
       │   Frontend   │    │    Backend API  │
       │  React + TS  │    │  Rust + Axum    │
       │  Port 3000   │    │  Port 8080      │
       └──────────────┘    └────────┬────────┘
                                    │
                     ┌──────────────┼──────────────┐
                     │              │              │
             ┌───────▼───┐  ┌───────▼───┐  ┌──────▼──────┐
             │ PostgreSQL │  │   Redis   │  │  S3/MinIO   │
             │   :5432    │  │   :6379   │  │   Files     │
             └───────────┘  └───────────┘  └─────────────┘
```

## Modules

| Module         | Description                                      |
|----------------|--------------------------------------------------|
| Authentication | JWT + Refresh tokens, 2FA, email verification   |
| Users          | Profiles, skills, experience, follow system      |
| Posts          | Feed, comments, likes, hashtags, mentions        |
| Chat           | Real-time messaging, groups, reactions           |
| Workspaces     | Organizations, members, RBAC                     |
| Projects       | Kanban boards, tasks, activity logs              |
| Notifications  | Real-time push via WebSocket                     |
| Analytics      | Profile views, engagement, workspace metrics     |
| Admin          | User management, content moderation, audit logs  |
| Files          | Upload/download, S3 integration                  |

## Technology Choices

- **Rust + Axum**: High performance, memory safety, async I/O
- **PostgreSQL**: ACID transactions, JSONB for flexible data, full-text search
- **Redis**: Session management, caching, rate limiting, pub/sub
- **React 19 + Vite**: Fast HMR, code splitting, tree shaking
- **TanStack Query**: Server state management, caching, background refetch
- **Redux Toolkit**: Client state (auth, chat, notifications, UI)
- **WebSockets**: Real-time bidirectional communication
- **Docker Compose**: One-command local development environment

## Request Flow

```
Client → Nginx → Axum Router → Middleware (Auth + Rate Limit) → Handler → Service → DB/Redis
```

## Real-Time Architecture

WebSocket connections are managed via `WsState` (DashMap of broadcast channels).
Each user and conversation gets its own broadcast channel.
Events flow: DB write → broadcast to channel → all connected subscribers receive event.

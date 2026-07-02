# Performance Guide

## Backend Performance

### Database
- All foreign keys indexed (see `002_indexes_and_updates.sql`)
- Denormalized counts on users table (followers_count, posts_count)
- JSONB fields used for flexible structured data (skills, reactions)
- `LIMIT/OFFSET` pagination with covering indexes
- Connection pool: 5 min, 20 max connections with 30-minute lifetime

### Redis Caching
- Email verification tokens: 24-hour TTL
- Password reset tokens: 1-hour TTL  
- Workspace invite tokens: 7-day TTL
- Rate limit counters: sliding window
- Session validation: cached to avoid DB hit

### Axum
- Compression middleware (gzip/brotli) on all responses
- Tracing middleware for structured logs
- Tokio async runtime with full feature set

## Frontend Performance

### Code Splitting
- Route-based lazy loading via React Router
- Vendor chunk separation in Vite config
- Dynamic imports for heavy components

### Data Fetching
- TanStack Query with stale-while-revalidate
- Infinite scroll with `useIntersectionObserver` hook
- Optimistic updates for likes/follows
- Prefetching on hover for likely-navigated routes

### Rendering
- `React.memo` on expensive list items (PostCard, MessageBubble)
- `useCallback` on event handlers passed to lists
- Virtual scrolling for long message lists (future)

### Assets
- Images: lazy loading with `loading="lazy"`
- Fonts: `font-display: swap`
- SVG icons via Lucide React (tree-shaken)
- Tailwind CSS purged in production build

## Monitoring

### Structured Logging
```
RUST_LOG=careertrack=info,tower_http=warn cargo run
```

Logs include: request_id, user_id, duration_ms, status_code

### Health Check
```bash
GET /api/v1/admin/system/health
→ {"database":"healthy","redis":"healthy","status":"healthy"}
```

# Contributing Guide

## Development Setup

1. Fork and clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Run `docker compose up -d postgres redis mailhog`
4. Backend: `cd backend && cargo run`
5. Frontend: `cd frontend && npm install && npm run dev`

## Branching Strategy

```
main          ← production-ready code
develop       ← integration branch
feature/*     ← new features
bugfix/*      ← bug fixes
hotfix/*      ← critical production fixes
release/*     ← release preparation
```

## Commit Convention

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

Examples:
```
feat(auth): implement refresh token rotation
feat(chat): add typing indicators via WebSocket
fix(posts): resolve pagination offset calculation
refactor(api): extract middleware to separate module
test(auth): add integration tests for 2FA flow
docs(api): update WebSocket event documentation
```

## Code Standards

### Rust (Backend)
- Run `cargo fmt` before committing
- Run `cargo clippy` and resolve warnings
- Add error handling — no `.unwrap()` in production paths
- All public functions need documentation comments

### TypeScript (Frontend)
- Run `npm run lint` before committing
- No `any` types — use proper TypeScript types
- Components must be functional with hooks
- Use TanStack Query for server state, Redux only for client state

## Pull Request Process

1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure CI passes (lint, format, test, build)
4. Request review from at least one maintainer
5. Squash and merge after approval

## Testing Requirements

- Backend: add unit tests in `#[cfg(test)]` modules
- Frontend: add component tests with React Testing Library
- API changes: add integration tests

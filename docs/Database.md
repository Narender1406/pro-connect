# Database Schema

## Overview

CareerTrack uses PostgreSQL with approximately 40+ tables organized by domain.

## Core Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Primary key |
| email | TEXT UNIQUE | Login email |
| password_hash | TEXT | Argon2/bcrypt hash |
| username | TEXT UNIQUE | URL-safe username |
| full_name | TEXT | Display name |
| role | user_role ENUM | user/moderator/admin/super_admin |
| status | user_status ENUM | active/suspended/deactivated/pending_verification |
| email_verified | BOOL | Email verification status |
| two_factor_enabled | BOOL | 2FA status |
| two_factor_secret | TEXT | TOTP secret (base32) |
| avatar_url | TEXT | S3 URL |
| headline | TEXT | Professional headline |
| bio | TEXT | Profile bio |
| followers_count | INT | Denormalized count |
| following_count | INT | Denormalized count |
| posts_count | INT | Denormalized count |

### sessions
Tracks active login sessions per device for device management.

### user_profiles
Stores structured JSON for skills, experience, education, portfolio links.

### follows
Many-to-many follower relationship (follower_id → following_id).

## Content Tables

- **posts** — Text/image/video/article/job/poll posts
- **comments** — Nested comments with parent_id
- **post_likes** — Post like junction table
- **comment_likes** — Comment like junction table
- **post_saves** — Saved posts

## Messaging Tables

- **conversations** — Direct and group conversations
- **conversation_members** — Many-to-many with role
- **messages** — Messages with JSONB read_by and reactions

## Workspace Tables

- **organizations** — Workspace entities
- **org_members** — Members with roles (owner/admin/member)
- **workspace_invites** — Pending invitations
- **projects** — Projects within workspaces
- **tasks** — Kanban tasks with board_column and position
- **task_comments** — Task discussion
- **activity_logs** — Project activity feed

## Platform Tables

- **notifications** — User notifications with actor reference
- **files** — Uploaded file metadata
- **audit_logs** — Admin action audit trail
- **reports** — Content reports
- **profile_views** — Profile view tracking

## Indexes

See `migrations/002_indexes_and_updates.sql` for all performance indexes.
Covering indexes on foreign keys, created_at timestamps, and text search fields.

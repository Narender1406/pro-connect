#!/usr/bin/env bash
# Seed the database with demo data for development
set -e

DB_URL="${DATABASE_URL:-postgresql://careertrack:careertrack_secret@localhost:5432/careertrack}"

echo "[seed] Inserting demo data..."

psql "$DB_URL" <<'EOF'
-- Demo users (passwords are argon2 hash of "Password123!")
INSERT INTO users (id, email, password_hash, username, full_name, role, status, email_verified, headline, bio, location, open_to_work)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@careertrack.dev',
   '$argon2id$v=19$m=19456,t=2,p=1$demo-hash-placeholder', 'admin', 'Admin User',
   'admin', 'active', true, 'Platform Administrator', 'Running CareerTrack', 'San Francisco, CA', false),
  ('22222222-2222-2222-2222-222222222222', 'alice@example.com',
   '$argon2id$v=19$m=19456,t=2,p=1$demo-hash-placeholder', 'alice', 'Alice Johnson',
   'user', 'active', true, 'Senior Rust Engineer @ Ferros', 'Building fast systems with Rust and WebAssembly', 'New York, NY', true),
  ('33333333-3333-3333-3333-333333333333', 'bob@example.com',
   '$argon2id$v=19$m=19456,t=2,p=1$demo-hash-placeholder', 'bob', 'Bob Smith',
   'user', 'active', true, 'Full-Stack Engineer | React & TypeScript', 'Passionate about great UX and clean code', 'Austin, TX', false)
ON CONFLICT DO NOTHING;

-- User profiles
INSERT INTO user_profiles (id, user_id, skills, experience, education)
VALUES
  (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222',
   '[{"name": "Rust", "level": "expert"}, {"name": "WebAssembly", "level": "advanced"}, {"name": "PostgreSQL", "level": "advanced"}]',
   '[{"id": "exp1", "company": "Ferros Systems", "title": "Senior Engineer", "current": true, "start_date": "2022-01", "skills_used": ["Rust", "Axum", "PostgreSQL"]}]',
   '[{"id": "edu1", "institution": "MIT", "degree": "B.S.", "field": "Computer Science", "start_year": 2016, "end_year": 2020}]'),
  (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333',
   '[{"name": "React", "level": "expert"}, {"name": "TypeScript", "level": "expert"}, {"name": "Node.js", "level": "advanced"}]',
   '[{"id": "exp2", "company": "TechCorp", "title": "Full-Stack Engineer", "current": true, "start_date": "2021-03", "skills_used": ["React", "TypeScript", "Node.js"]}]',
   '[{"id": "edu2", "institution": "UT Austin", "degree": "B.S.", "field": "Software Engineering", "start_year": 2017, "end_year": 2021}]')
ON CONFLICT DO NOTHING;

-- Demo posts
INSERT INTO posts (id, author_id, content, post_type, hashtags, visibility)
VALUES
  (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222',
   'Just shipped a new feature: zero-copy deserialization in our Rust API! 🦀 The performance gains are incredible — 40% reduction in latency.',
   'text', ARRAY['rust', 'performance', 'backend'], 'public'),
  (uuid_generate_v4(), '33333333-3333-3333-3333-333333333333',
   'React 19 is a game-changer! The new compiler optimizations and use() hook make our codebase so much cleaner. Excited to see where this goes.',
   'text', ARRAY['react', 'frontend', 'typescript'], 'public'),
  (uuid_generate_v4(), '22222222-2222-2222-2222-222222222222',
   '🚀 Open to Work! Looking for senior backend engineering roles. 5+ years of Rust experience. DM me or check my profile.',
   'job_post', ARRAY['opentowork', 'rust', 'hiring'], 'public')
ON CONFLICT DO NOTHING;

-- Follow relationships
INSERT INTO follows (follower_id, following_id)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Update follower counts
UPDATE users SET followers_count=1, following_count=1
WHERE id IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

UPDATE users SET posts_count=2 WHERE id='22222222-2222-2222-2222-222222222222';
UPDATE users SET posts_count=1 WHERE id='33333333-3333-3333-3333-333333333333';

-- Demo workspace
INSERT INTO organizations (id, name, slug, description, owner_id, industry)
VALUES ('44444444-4444-4444-4444-444444444444', 'Demo Workspace', 'demo-workspace',
        'A demo workspace for testing CareerTrack', '22222222-2222-2222-2222-222222222222', 'Technology')
ON CONFLICT DO NOTHING;

INSERT INTO org_members (org_id, user_id, role)
VALUES ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'owner'),
       ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'member')
ON CONFLICT DO NOTHING;

-- Demo project
INSERT INTO projects (id, workspace_id, name, description, owner_id, status)
VALUES ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444',
        'CareerTrack MVP', 'Building the core platform', '22222222-2222-2222-2222-222222222222', 'active')
ON CONFLICT DO NOTHING;

-- Demo tasks
INSERT INTO tasks (id, project_id, board_column, title, description, reporter_id, priority, labels)
VALUES
  (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'done', 'Set up project structure', 'Initialize monorepo', '22222222-2222-2222-2222-222222222222', 'high', ARRAY['setup']),
  (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'in_progress', 'Implement authentication', 'JWT + Argon2 auth', '22222222-2222-2222-2222-222222222222', 'critical', ARRAY['auth', 'security']),
  (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'todo', 'Add real-time chat', 'WebSocket messaging', '33333333-3333-3333-3333-333333333333', 'high', ARRAY['chat', 'realtime']),
  (uuid_generate_v4(), '55555555-5555-5555-5555-555555555555', 'todo', 'Write tests', 'Unit + integration tests', '33333333-3333-3333-3333-333333333333', 'medium', ARRAY['testing'])
ON CONFLICT DO NOTHING;

\echo '[seed] Demo data inserted successfully!'
\echo '[seed] Login: alice@example.com / Password123!'
EOF

echo "[seed] Done!"

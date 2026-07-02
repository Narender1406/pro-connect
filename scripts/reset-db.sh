#!/usr/bin/env bash
# Reset and reseed the database
set -e

DB_URL="${DATABASE_URL:-postgresql://careertrack:careertrack_secret@localhost:5432/careertrack}"

echo "[reset-db] Dropping and recreating database..."
psql "${DB_URL%/*}/postgres" -c "DROP DATABASE IF EXISTS careertrack;"
psql "${DB_URL%/*}/postgres" -c "CREATE DATABASE careertrack OWNER careertrack;"

echo "[reset-db] Running migrations..."
cd "$(dirname "$0")/../backend" && cargo run -- migrate 2>/dev/null || true

echo "[reset-db] Running seeds..."
bash "$(dirname "$0")/seed.sh"

echo "[reset-db] Done! Database reset complete."

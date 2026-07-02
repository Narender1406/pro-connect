#!/usr/bin/env bash
set -e

echo ""
echo " CareerTrack - Local Development Setup"
echo " ======================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed."
    exit 1
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    echo "[INFO] Creating .env from .env.example..."
    cp .env.example .env
    echo "[WARN] Review .env and update secrets before production use."
fi

echo "[INFO] Starting infrastructure services..."
docker compose up -d postgres redis mailhog minio

echo "[INFO] Waiting for PostgreSQL..."
sleep 5

echo ""
echo " Services started:"
echo "  PostgreSQL : localhost:5432"
echo "  Redis      : localhost:6379"
echo "  MailHog UI : http://localhost:8025"
echo "  MinIO UI   : http://localhost:9001 (admin/minioadmin)"
echo ""
echo " Development mode:"
echo "  Backend:  cd backend && cargo run"
echo "  Frontend: cd frontend && npm install && npm run dev"
echo ""
echo " Full Docker stack: docker compose up -d"
echo " App: http://localhost:3000"
echo ""

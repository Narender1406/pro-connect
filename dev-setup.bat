@echo off
echo.
echo  CareerTrack - Local Development Setup
echo  ======================================
echo.

REM Check Docker
docker --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Copy .env if not exists
IF NOT EXIST ".env" (
    echo [INFO] Creating .env from .env.example...
    copy ".env.example" ".env"
    echo [WARN] Please review .env and update JWT_SECRET and other secrets before production use.
)

echo [INFO] Starting infrastructure services (PostgreSQL, Redis, MailHog, MinIO)...
docker compose up -d postgres redis mailhog minio

echo [INFO] Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo.
echo  Services started:
echo   PostgreSQL : localhost:5432
echo   Redis      : localhost:6379
echo   MailHog UI : http://localhost:8025
echo   MinIO UI   : http://localhost:9001 (admin/minioadmin)
echo.
echo  To start the full stack:
echo   docker compose up -d
echo.
echo  To start in development mode:
echo   Backend:  cd backend ^&^& cargo run
echo   Frontend: cd frontend ^&^& npm install ^&^& npm run dev
echo.
echo  App will be at: http://localhost:3000
echo  API will be at: http://localhost:8080
echo.

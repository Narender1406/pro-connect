@echo off
echo Starting CareerTrack Application...
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd /d backend && npm start"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo.
echo ✅ Both servers are starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause

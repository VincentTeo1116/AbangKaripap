@echo off
title ABANG KARIPAP
color 0A

cls
echo Installing requirements...
python -m pip install -r requirements.txt
echo.
echo Starting Backend and Frontend...
echo.

:: Start Backend in new window
start "Backend Server" cmd /c "cd backend && python -m uvicorn main:app --reload --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend in new window
start "Frontend Server" cmd /c "cd frontend && npm start"

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Both servers are running!
echo Close the server windows to stop.
echo.
pause
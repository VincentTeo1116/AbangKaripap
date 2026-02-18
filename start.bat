@echo off
title ABANG KARIPAP
color 0A

cls
echo Starting ABANG KARIPAP...
echo.

:: Check if node_modules exists
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
) else (
    echo Frontend dependencies already installed
)

:: Install backend requirements
echo Installing backend requirements...
cd backend
python -m pip install fastapi uvicorn python-dotenv requests pydantic python-multipart
cd ..

echo.
echo Starting servers...
echo.

:: Start Backend
start "Backend Server" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

:: Wait
timeout /t 3 >nul

:: Start Frontend  
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Servers started! Close the windows to stop.
echo.
pause
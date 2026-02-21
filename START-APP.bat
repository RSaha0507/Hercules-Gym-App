@echo off
echo ================================================
echo Hercules Gym Management App - Quick Start
echo ================================================
echo.
echo This script will help you start both the backend and frontend.
echo.
echo Prerequisites Check:
echo ====================
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I "mongod.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is running
) else (
    echo [ERROR] MongoDB is not running!
    echo Please start MongoDB before continuing.
    pause
    exit /b 1
)

echo.
echo Starting Backend Server...
echo =========================
echo The backend will start on http://127.0.0.1:8001
echo API Documentation will be available at http://127.0.0.1:8001/docs
echo.
start "Hercules Gym Backend" cmd /k "cd backend && call ..\.venv\Scripts\activate && python -m uvicorn server:app --host 127.0.0.1 --port 8001"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >NUL

echo.
echo Starting Frontend (Expo) Server...
echo ===================================
echo The Expo development server will start.
echo You can then:
echo - Press 'w' to open in web browser
 - Press 'a' to open in Android emulator
 - Press 'i' to open in iOS simulator (Mac only)
 - Scan QR code with Expo Go app on your device
echo.
start "Hercules Gym Frontend" cmd /k "cd frontend && npx expo start"

echo.
echo ================================================
echo Both servers are starting!
echo ================================================
echo.
echo Backend: http://127.0.0.1:8001
echo API Docs: http://127.0.0.1:8001/docs
echo Frontend: Check the Expo terminal for options
echo.
echo Default Admin Login:
echo Email: admin@herculesgym.com
echo Password: admin123
echo.
echo IMPORTANT: Change the admin password after first login!
echo ================================================
pause

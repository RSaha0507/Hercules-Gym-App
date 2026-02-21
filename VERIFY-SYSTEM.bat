@echo off
echo ================================================
echo Hercules Gym - System Verification
echo ================================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo [OK] Node.js %NODE_VER% installed
) else (
    echo [ERROR] Node.js not found
    set ERROR_FOUND=1
)

REM Check npm
echo Checking npm...
npm --version >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo [OK] npm %NPM_VER% installed
) else (
    echo [ERROR] npm not found
    set ERROR_FOUND=1
)

REM Check Python
echo Checking Python...
python --version >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VER=%%i
    echo [OK] %PYTHON_VER% installed
) else (
    echo [ERROR] Python not found
    set ERROR_FOUND=1
)

REM Check MongoDB
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I "mongod.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is running
) else (
    echo [WARNING] MongoDB not running - Start it before running the app
)

REM Check Backend Dependencies
echo.
echo Checking Backend Dependencies...
if exist ".venv\Scripts\activate.bat" (
    echo [OK] Virtual environment exists
    call .venv\Scripts\python.exe -c "import fastapi" 2>NUL
    if "%ERRORLEVEL%"=="0" (
        echo [OK] FastAPI installed
    ) else (
        echo [ERROR] FastAPI not installed
        set ERROR_FOUND=1
    )
) else (
    echo [ERROR] Virtual environment not found
    set ERROR_FOUND=1
)

REM Check Frontend Dependencies
echo.
echo Checking Frontend Dependencies...
if exist "frontend\node_modules\expo" (
    echo [OK] Expo installed
) else (
    echo [ERROR] Expo not installed - Run: cd frontend ^&^& npm install --legacy-peer-deps
    set ERROR_FOUND=1
)

if exist "frontend\node_modules\react-native" (
    echo [OK] React Native installed
) else (
    echo [ERROR] React Native not installed
    set ERROR_FOUND=1
)

REM Check Configuration Files
echo.
echo Checking Configuration...
if exist "backend\.env" (
    echo [OK] Backend .env exists
) else (
    echo [ERROR] Backend .env missing
    set ERROR_FOUND=1
)

if exist "frontend\.env" (
    echo [OK] Frontend .env exists
) else (
    echo [ERROR] Frontend .env missing
    set ERROR_FOUND=1
)

REM Check Assets
echo.
echo Checking Assets...
if exist "frontend\assets\images\hercules-logo.png" (
    echo [OK] Logo image exists
) else (
    echo [ERROR] Logo image missing
    set ERROR_FOUND=1
)

echo.
if "%ERROR_FOUND%"=="1" (
    echo ================================================
    echo [FAILED] Some checks failed. Please fix the errors above.
    echo ================================================
) else (
    echo ================================================
    echo [SUCCESS] All checks passed! Ready to run.
    echo ================================================
    echo.
    echo To start the app, run: START-APP.bat
    echo Or manually start backend and frontend separately.
)
echo.
pause

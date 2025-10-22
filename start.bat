@echo off
REM Tantra IDE Startup Script for Windows

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════╗
echo ║           Tantra IDE Startup           ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("!NODE_VERSION!") do set NODE_MAJOR=%%i

if !NODE_MAJOR! LSS 18 (
    echo [ERROR] Node.js version 18+ is required. Current version: !NODE_VERSION!
    pause
    exit /b 1
)

echo [SUCCESS] Node.js !NODE_VERSION! detected

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [SUCCESS] npm detected

REM Install dependencies
echo [INFO] Installing dependencies...

if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install root dependencies
        pause
        exit /b 1
    )
)

if not exist "frontend\node_modules" (
    cd frontend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

if not exist "backend\node_modules" (
    cd backend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo [SUCCESS] Dependencies installed

REM Create environment files
echo [INFO] Setting up environment files...

if not exist "backend\.env" (
    (
        echo PORT=3001
        echo OLLAMA_URL=http://localhost:11434
        echo OLLAMA_MODEL=qwen2.5-coder:7b
        echo WORKSPACE_PATH=./workspace
        echo NODE_ENV=development
    ) > backend\.env
    echo [SUCCESS] Created backend\.env
)

if not exist "frontend\.env" (
    (
        echo VITE_API_URL=http://localhost:3001
        echo VITE_WS_URL=ws://localhost:3001
    ) > frontend\.env
    echo [SUCCESS] Created frontend\.env
)

REM Create workspace directory
if not exist "workspace" (
    mkdir workspace
    echo [SUCCESS] Created workspace directory
)

REM Check Ollama
ollama --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama is not installed!
    echo Please install Ollama from: https://ollama.com/
    echo After installation, run: ollama pull qwen2.5-coder:7b
) else (
    echo [SUCCESS] Ollama detected
    
    REM Check if qwen2.5-coder model is available
    ollama list | findstr "qwen2.5-coder" >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] qwen2.5-coder model not found. Pulling...
        ollama pull qwen2.5-coder:7b
    )
    
    echo [SUCCESS] Ollama models ready
)

echo.
echo [SUCCESS] Setup complete! Starting Tantra IDE...
echo [INFO] Backend will start on: http://localhost:3001
echo [INFO] Frontend will start on: http://localhost:5173
echo [INFO] Press Ctrl+C to stop
echo.

REM Start the application
call npm run dev

pause

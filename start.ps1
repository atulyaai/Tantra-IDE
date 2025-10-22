# Tantra IDE Startup Script for PowerShell

param(
    [switch]$SkipChecks,
    [switch]$Help
)

if ($Help) {
    Write-Host "Tantra IDE Startup Script" -ForegroundColor Cyan
    Write-Host "Usage: .\start.ps1 [-SkipChecks] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -SkipChecks    Skip dependency checks" -ForegroundColor Gray
    Write-Host "  -Help          Show this help message" -ForegroundColor Gray
    exit 0
}

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

function Write-Status {
    param([string]$Message, [string]$Color = "Blue")
    Write-Host "[INFO] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 18) {
            Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
            exit 1
        }
        
        Write-Success "Node.js $nodeVersion detected"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed!"
        Write-Host "Please install Node.js 18+ from: https://nodejs.org/" -ForegroundColor $Colors.Yellow
        exit 1
    }
}

# Check if npm is installed
function Test-NPM {
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion detected"
        return $true
    }
    catch {
        Write-Error "npm is not installed!"
        exit 1
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    if (-not (Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install root dependencies"
            exit 1
        }
    }
    
    if (-not (Test-Path "frontend\node_modules")) {
        Set-Location frontend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            exit 1
        }
        Set-Location ..
    }
    
    if (-not (Test-Path "backend\node_modules")) {
        Set-Location backend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install backend dependencies"
            exit 1
        }
        Set-Location ..
    }
    
    Write-Success "Dependencies installed"
}

# Setup environment files
function Setup-Environment {
    Write-Status "Setting up environment files..."
    
    # Backend .env
    if (-not (Test-Path "backend\.env")) {
        $backendEnv = @"
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
WORKSPACE_PATH=./workspace
NODE_ENV=development
"@
        $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
        Write-Success "Created backend\.env"
    }
    
    # Frontend .env
    if (-not (Test-Path "frontend\.env")) {
        $frontendEnv = @"
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
"@
        $frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8
        Write-Success "Created frontend\.env"
    }
}

# Setup workspace
function Setup-Workspace {
    if (-not (Test-Path "workspace")) {
        New-Item -ItemType Directory -Path "workspace" | Out-Null
        Write-Success "Created workspace directory"
    }
}

# Check Ollama
function Test-Ollama {
    try {
        $ollamaVersion = ollama --version
        Write-Success "Ollama detected"
        
        # Check if qwen2.5-coder model is available
        $models = ollama list
        if ($models -notmatch "qwen2.5-coder") {
            Write-Warning "qwen2.5-coder model not found. Pulling..."
            ollama pull qwen2.5-coder:7b
        }
        
        Write-Success "Ollama models ready"
        return $true
    }
    catch {
        Write-Warning "Ollama is not installed!"
        Write-Host "Please install Ollama from: https://ollama.com/" -ForegroundColor $Colors.Yellow
        Write-Host "After installation, run: ollama pull qwen2.5-coder:7b" -ForegroundColor $Colors.Yellow
        return $false
    }
}

# Start application
function Start-Application {
    Write-Status "Starting Tantra IDE..."
    Write-Status "Backend will start on: http://localhost:3001"
    Write-Status "Frontend will start on: http://localhost:5173"
    Write-Status "Press Ctrl+C to stop"
    Write-Host ""
    
    npm run dev
}

# Main execution
function Main {
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor $Colors.Cyan
    Write-Host "║           Tantra IDE Startup           ║" -ForegroundColor $Colors.Cyan
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor $Colors.Cyan
    Write-Host ""
    
    if (-not $SkipChecks) {
        Test-NodeJS
        Test-NPM
    }
    
    Install-Dependencies
    Setup-Environment
    Setup-Workspace
    Test-Ollama
    
    Write-Host ""
    Write-Success "Setup complete! Starting Tantra IDE..."
    Write-Host ""
    
    Start-Application
}

# Run main function
try {
    Main
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}

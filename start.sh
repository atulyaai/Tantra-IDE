#!/bin/bash
# Tantra IDE Startup Script for Linux/macOS

set -e

echo "🚀 Starting Tantra IDE..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        echo "Please install Node.js 18+ from: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed!"
        exit 1
    fi
    
    print_success "npm $(npm --version) detected"
}

# Check if Ollama is installed
check_ollama() {
    if ! command -v ollama &> /dev/null; then
        print_warning "Ollama is not installed!"
        echo "Please install Ollama from: https://ollama.com/"
        echo "After installation, run: ollama pull qwen2.5-coder:7b"
        return 1
    fi
    
    print_success "Ollama detected"
    return 0
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        cd frontend && npm install && cd ..
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        cd backend && npm install && cd ..
    fi
    
    print_success "Dependencies installed"
}

# Create environment files
setup_env() {
    print_status "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
WORKSPACE_PATH=./workspace
NODE_ENV=development
EOF
        print_success "Created backend/.env"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
EOF
        print_success "Created frontend/.env"
    fi
}

# Create workspace directory
setup_workspace() {
    if [ ! -d "workspace" ]; then
        mkdir -p workspace
        print_success "Created workspace directory"
    fi
}

# Start Ollama if available
start_ollama() {
    if check_ollama; then
        print_status "Checking Ollama models..."
        
        # Check if qwen2.5-coder model is available
        if ! ollama list | grep -q "qwen2.5-coder"; then
            print_warning "qwen2.5-coder model not found. Pulling..."
            ollama pull qwen2.5-coder:7b
        fi
        
        print_success "Ollama models ready"
    fi
}

# Start the application
start_app() {
    print_status "Starting Tantra IDE..."
    print_status "Backend will start on: http://localhost:3001"
    print_status "Frontend will start on: http://localhost:5173"
    print_status "Press Ctrl+C to stop"
    
    # Start both frontend and backend
    npm run dev
}

# Main execution
main() {
    echo "╔════════════════════════════════════════╗"
    echo "║           Tantra IDE Startup           ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    check_node
    check_npm
    install_deps
    setup_env
    setup_workspace
    start_ollama
    
    echo ""
    print_success "Setup complete! Starting Tantra IDE..."
    echo ""
    
    start_app
}

# Run main function
main "$@"

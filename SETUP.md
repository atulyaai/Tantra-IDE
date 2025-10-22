# Tantra IDE - Setup Guide

## Prerequisites Installation

### 1. Install Node.js and npm

**Windows**:
```powershell
# Download and install from: https://nodejs.org/
# Or use Chocolatey:
choco install nodejs

# Verify installation:
node --version  # Should show v18 or higher
npm --version   # Should show v9 or higher
```

**macOS**:
```bash
# Using Homebrew:
brew install node

# Or download from: https://nodejs.org/
```

**Linux**:
```bash
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora:
sudo dnf install nodejs
```

### 2. Install Ollama (for AI features)

**Windows**:
```powershell
# Download from: https://ollama.com/download
# Run the installer

# Verify:
ollama --version
```

**macOS**:
```bash
curl -fsSL https://ollama.com/install.sh | sh

# Or use Homebrew:
brew install ollama
```

**Linux**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 3. Pull AI Models

```bash
# Primary code generation model (required)
ollama pull qwen2.5-coder:7b

# Vision model for image tagging (optional)
ollama pull llava:7b

# Alternative models (optional)
ollama pull deepseek-coder:6.7b
ollama pull codellama:7b-instruct
```

### 4. Optional Tools

**Ripgrep** (for faster code search):
```bash
# Windows (Chocolatey):
choco install ripgrep

# macOS:
brew install ripgrep

# Linux:
sudo apt install ripgrep
```

**Git** (for version control features):
```bash
# Usually pre-installed, verify with:
git --version
```

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/atulyaai/Tantra-IDE
cd Tantra-IDE
```

### 2. Install Dependencies

```bash
# Install all dependencies (root + frontend + backend)
npm install

# Or install separately:
npm install          # Root workspace
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configure Environment

**Backend** (create `backend/.env`):
```env
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
WORKSPACE_PATH=./workspace
NODE_ENV=development
```

**Frontend** (create `frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 4. Create Workspace Directory

```bash
mkdir workspace
cd workspace
# This is where your projects will be opened
```

## Running the IDE

### Development Mode

**Option 1: Run both frontend and backend together** (recommended):
```bash
npm run dev
```

**Option 2: Run separately**:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Open in Browser

Navigate to: **http://localhost:5173**

## Verify Everything Works

1. **Check Ollama Connection**:
   - Open Tantra IDE
   - Look at status bar (bottom) - should show "Ollama Connected"

2. **Test File Explorer**:
   - Left sidebar should show file tree
   - Try opening a file

3. **Test Editor**:
   - File should open in Monaco editor
   - Try editing and saving (Ctrl+S / Cmd+S)

4. **Test AI Chat**:
   - Right sidebar - type a message
   - AI should respond

5. **Test Terminal**:
   - Bottom panel - should show terminal
   - Try running commands

## Troubleshooting

### Ollama Not Connecting

```bash
# Check if Ollama is running:
ollama list

# Start Ollama service:
ollama serve

# Test API:
curl http://localhost:11434/api/tags
```

### Port Already in Use

```bash
# Change ports in .env files:
# Backend: PORT=3002
# Frontend: VITE_API_URL=http://localhost:3002
```

### Dependencies Installation Failed

```bash
# Clear npm cache and reinstall:
npm cache clean --force
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
```

### Terminal Not Working

**Windows**: Ensure PowerShell is installed and accessible

**macOS/Linux**: Ensure bash is available

### File Watching Issues

```bash
# Increase file watchers limit (Linux):
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Building for Production

```bash
# Build both frontend and backend
npm run build

# Build separately:
cd frontend && npm run build
cd ../backend && npm run build

# Run production build:
cd backend && npm start
```

## Next Steps

1. **Open a Project**: Click "Open Folder" or use the file tree
2. **Start Coding**: Use Monaco editor with full IDE features
3. **Ask AI**: Use the AI assistant for code generation, debugging
4. **Deploy**: One-click deployment when ready

## Getting Help

- **Documentation**: See [README.md](./README.md)
- **Roadmap**: See [ROADMAP.md](./ROADMAP.md)
- **Issues**: https://github.com/atulyaai/Tantra-IDE/issues
- **Discussions**: https://github.com/atulyaai/Tantra-IDE/discussions

## Development

### Adding New Features

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

### Project Structure

```
tantra-ide/
├── frontend/       # React frontend
├── backend/        # Express backend
├── README.md       # Main documentation
├── ROADMAP.md      # Development roadmap
└── SETUP.md        # This file
```

### Available Scripts

```bash
# Development
npm run dev              # Start both
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Building
npm run build            # Build both
npm run build:frontend   # Frontend only
npm run build:backend    # Backend only

# Installation
npm run install:all      # Install all dependencies
```

---

**Enjoy coding with Tantra IDE! 🚀**


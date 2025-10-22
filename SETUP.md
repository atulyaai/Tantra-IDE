# 🚀 Tantra IDE - Setup & Installation Guide

## Prerequisites

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) | JavaScript runtime |
| **npm** | 9+ | Comes with Node.js | Package manager |
| **Ollama** | Latest | [ollama.com](https://ollama.com/) | Local LLM inference |

### Optional Software

| Software | Purpose | Installation |
|----------|---------|--------------|
| **Git** | Version control features | Usually pre-installed |
| **Ripgrep** | Faster code search | `choco install ripgrep` (Windows) |

## Installation Steps

### 1. Install Node.js and npm

**Windows (Recommended)**:
```powershell
# Download from: https://nodejs.org/
# Choose LTS version (18.x or higher)
# Run installer with default settings
# Restart terminal/PowerShell

# Verify installation:
node --version  # Should show v18.x or higher
npm --version   # Should show v9.x or higher
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

### 2. Install Ollama

**Windows**:
```powershell
# Download from: https://ollama.com/download
# Run the installer
# Verify: ollama --version
```

**macOS**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
# Or: brew install ollama
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

### 4. Clone and Install Tantra IDE

```bash
# Clone repository
git clone https://github.com/atulyaai/Tantra-IDE
cd Tantra-IDE

# Install all dependencies
npm install

# Or install separately:
npm install          # Root workspace
cd frontend && npm install
cd ../backend && npm install
```

### 5. Configure Environment

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

### 6. Create Workspace Directory

```bash
mkdir workspace
cd workspace
# This is where your projects will be opened
```

## Running Tantra IDE

### Development Mode

**Option 1: Run both together** (recommended):
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

## Verification Checklist

### ✅ Core Features
- [ ] **File Explorer**: File tree loads and displays project files
- [ ] **Monaco Editor**: Opens files with syntax highlighting
- [ ] **Terminal**: Integrated terminal accepts commands
- [ ] **Status Bar**: Shows Git branch and Ollama connection status

### ✅ AI Features
- [ ] **Chat Panel**: AI responds to messages
- [ ] **Code Generation**: AI generates code from prompts
- [ ] **Tool Calling**: AI can read/write files through function calls

### ✅ Development Tools
- [ ] **Git Integration**: Shows git status and changes
- [ ] **Package Management**: Detects and manages dependencies
- [ ] **Security Scanning**: Scans for vulnerabilities
- [ ] **Live Search**: Searches Stack Overflow, GitHub, npm

## Troubleshooting

### Common Issues

**Issue**: "npm is not recognized"
- **Solution**: Install Node.js from https://nodejs.org/

**Issue**: "Ollama model not found"
- **Solution**: Run `ollama pull qwen2.5-coder:7b`

**Issue**: "Port already in use"
- **Solution**: Change ports in .env files or kill existing processes

**Issue**: "File watching limit exceeded" (Linux)
- **Solution**: 
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Ollama Not Connecting

```bash
# Check if Ollama is running:
ollama list

# Start Ollama service:
ollama serve

# Test API:
curl http://localhost:11434/api/tags
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

## Performance Expectations

| Metric | Expected Value |
|--------|----------------|
| **Startup Time** | Backend ~2-3s, Frontend ~1-2s |
| **AI Response Time** | 2-10s depending on model and task complexity |
| **File Operations** | Near-instant for small files, <1s for large files |
| **Memory Usage** | ~200-500MB for backend, ~100-300MB for frontend |

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

---

**🎉 Enjoy coding with Tantra IDE!**
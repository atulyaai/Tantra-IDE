# Tantra IDE - Quick Start

## 🚀 Get Running in 5 Minutes!

### Step 1: Install Prerequisites (One-time setup)

#### Install Node.js
- **Windows**: Download from https://nodejs.org/ and run installer
- **macOS**: `brew install node`
- **Linux**: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`

#### Install Ollama
- **All platforms**: Visit https://ollama.com/download and follow instructions
- **Or macOS/Linux**: `curl -fsSL https://ollama.com/install.sh | sh`

#### Pull AI Model
```bash
ollama pull qwen2.5-coder:7b
```

### Step 2: Clone & Install (3 minutes)

```bash
# Clone
git clone https://github.com/atulyaai/Tantra-IDE
cd Tantra-IDE

# Install dependencies
npm install
```

### Step 3: Run (30 seconds)

```bash
# Start everything
npm run dev
```

### Step 4: Open Browser

Go to: **http://localhost:5173**

## ✅ You're Done!

You should see:
- **Left**: File explorer
- **Center**: Code editor
- **Right**: AI chat
- **Bottom**: Terminal

## 🎯 Try These

1. **Open a file**: Click any file in the left sidebar
2. **Chat with AI**: Type in the right panel: "Create a React button component"
3. **Use terminal**: Bottom panel - try running `ls` or `dir`
4. **Save file**: Edit code and press `Ctrl+S` (or `Cmd+S` on Mac)

## 🐛 Issues?

### Ollama not connected?
```bash
# Start Ollama
ollama serve

# Verify
ollama list
```

### Port already in use?
```bash
# Kill process on port 3001 (backend):
# Windows: netstat -ano | findstr :3001 then taskkill /PID <PID> /F
# macOS/Linux: lsof -ti:3001 | xargs kill
```

### Dependencies failed?
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
```

## 📚 Learn More

- **Full Setup**: See [SETUP.md](./SETUP.md)
- **Features**: See [README.md](./README.md)
- **Roadmap**: See [ROADMAP.md](./ROADMAP.md)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 🎉 Happy Coding!

Start building amazing projects with AI assistance!

---

**Need help?** Open an issue: https://github.com/atulyaai/Tantra-IDE/issues


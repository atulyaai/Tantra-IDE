# Tantra IDE

> AI-Powered Web IDE with Local LLM - Build, Code, Deploy with AI Assistance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black)](https://ollama.com)

## 🚀 Features

### Core IDE
- **Monaco Code Editor** - VSCode's editor with IntelliSense, multi-cursor, syntax highlighting
- **File Management** - Full CRUD operations, drag-drop, context menus
- **Integrated Terminal** - Run commands directly in the IDE
- **Multi-tab Editing** - Work on multiple files simultaneously
- **Code Search** - Fast search with ripgrep integration
- **Command Palette** - Quick actions with Cmd/Ctrl+K

### AI Capabilities (Powered by Ollama)
- **AI Chat Assistant** - Context-aware conversations about your code
- **Code Generation** - Generate entire projects from natural language prompts
- **Multi-file Editing** - AI can read, create, and modify multiple files
- **Inline Completion** - Real-time code suggestions as you type
- **Error Fixing** - AI explains errors and suggests one-click fixes
- **Test Generation** - Auto-generate unit, integration, and E2E tests
- **Documentation** - Auto-generate README, API docs, and comments

### Development Tools
- **Git Integration** - Status, diff, commit, push/pull, branch management
- **Linting** - ESLint, Pylint with inline error highlighting
- **Package Management** - Auto-detect and install dependencies (npm, pip, cargo)
- **Security Scanning** - Find vulnerabilities in dependencies and code
- **Performance Profiling** - Analyze bottlenecks and optimize code
- **Bundle Analyzer** - Visualize what's in your production bundle

### DevOps & Deployment
- **One-Click Deploy** - Deploy to Vercel, Netlify, AWS with single click
- **Docker Support** - Generate Dockerfile and docker-compose.yml
- **CI/CD Pipelines** - Auto-generate GitHub Actions, GitLab CI configs
- **Log Streaming** - View production logs in the IDE
- **Environment Setup** - Auto-create .env files with placeholders

### Media & Assets
- **Media Browser** - Visual gallery for images and videos
- **AI Image Tagging** - Automatic tagging using LLaVA vision model
- **Asset Optimization** - Compress and resize images
- **Usage Finder** - Find where assets are used in code

### Advanced Features
- **Live Web Search** - Search Stack Overflow, GitHub, npm while coding
- **Database Tools** - Visual DB browser, query builder, migration generator
- **Accessibility Scanner** - Check and fix A11y issues
- **Cloud Integration** - View AWS/GCP/Azure resources
- **Autonomous Agent** - AI can plan and execute multi-step tasks

### Future: Jarvis Mode 🎯
Voice interface with wake word, speech recognition, and natural language commands

## 🛠️ Tech Stack

**Frontend**: React 18 + TypeScript + Vite + Monaco Editor + Tailwind CSS  
**Backend**: Node.js + Express + TypeScript  
**AI/LLM**: Ollama (local inference) - qwen2.5-coder, deepseek-coder, llava  
**Terminal**: xterm.js + node-pty  
**Git**: simple-git  
**Database**: SQLite (Better-SQLite3)  
**Search**: Ripgrep

## 📦 Prerequisites

### Required
- **Node.js** 18 or higher
- **npm** 9 or higher
- **Ollama** - For local AI inference

### Optional
- **Git** - For version control features
- **Docker** - For containerization features
- **Ripgrep** - For fast code search (falls back to grep)

## 🚀 Quick Start

### Prerequisites

**Required**:
- **Node.js 18+** and **npm 9+** - [Download here](https://nodejs.org/)
- **Ollama** - [Download here](https://ollama.com/download)

**Optional**:
- **Git** - For version control features
- **Ripgrep** - For faster code search

### 1. Install Ollama

```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### 2. Pull AI Models

```bash
# Code generation model (required)
ollama pull qwen2.5-coder:7b

# Vision model for image tagging (optional)
ollama pull llava:7b

# Alternative code models (optional)
ollama pull deepseek-coder:6.7b
ollama pull codellama:7b-instruct
```

### 3. Clone & Install

```bash
git clone https://github.com/atulyaai/Tantra-IDE
cd Tantra-IDE

# Install all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 4. Configure Environment

**Create `backend/.env`**:
```env
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
WORKSPACE_PATH=./workspace
NODE_ENV=development
```

**Create `frontend/.env`**:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 5. Start Development

```bash
# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

### 6. Open Browser

Navigate to **http://localhost:5173**

## 📋 Testing Status

**Current Status**: ✅ **Ready for Testing**

- ✅ All 10 core features implemented
- ✅ Backend API routes complete
- ✅ Frontend components built
- ✅ Ollama integration ready
- ✅ Documentation complete

**See [TESTING.md](./TESTING.md) for detailed testing procedures**

## 📖 Usage

### Basic Workflow

1. **Open Project** - Click "Open Folder" or use the file tree
2. **Edit Code** - Use Monaco editor with full IDE features
3. **Chat with AI** - Ask questions or request code generation
4. **Run Terminal** - Execute commands in integrated terminal
5. **Deploy** - One-click deployment when ready

### AI Commands

```
User: "Create a React component for user login"
AI: [Generates LoginForm.tsx with validation and styling]

User: "@file src/App.tsx add routing for login page"
AI: [Reads App.tsx, adds React Router setup]

User: "Find all TODO comments in the project"
AI: [Searches codebase, lists all TODOs]

User: "Deploy to Vercel"
AI: [Generates config, deploys, provides URL]
```

### Context Mentions

- `@file path/to/file.ts` - Reference specific file
- `@folder src/components` - Reference entire folder
- `@code` - Reference selected code
- `@terminal` - Reference terminal output

## 🎯 Project Structure

```
tantra-ide/
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── services/   # API services
│   │   ├── stores/     # Zustand state
│   │   └── App.tsx
│   └── package.json
├── backend/            # Express backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── tools/      # AI tools
│   │   └── server.ts
│   └── package.json
├── README.md
├── ROADMAP.md         # Development roadmap
└── package.json       # Workspace root
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in frontend and backend:

**backend/.env**:
```env
PORT=3001
OLLAMA_URL=http://localhost:11434
WORKSPACE_PATH=./workspace
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:3001
```

### Ollama Configuration

Models are configured in `backend/src/services/ollamaService.ts`:
- Default model: `qwen2.5-coder:7b`
- Temperature: `0.7`
- Max tokens: `4096`

## 📚 Documentation

- [TESTING.md](./TESTING.md) - Testing procedures and results
- [API.md](./API.md) - Complete API documentation
- [ROADMAP.md](./ROADMAP.md) - Full feature list and development timeline
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [System Prompts](./backend/src/prompts/) - AI agent configurations
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🙏 Acknowledgments

- **Monaco Editor** - Microsoft's VSCode editor
- **Ollama** - Local LLM inference
- **Qwen Team** - qwen2.5-coder model
- **Cursor AI** - Inspiration for AI-powered IDE features
- **Continue.dev** - Inspiration for context-aware chat

## 🐛 Issues & Support

Found a bug? Have a feature request?

- [GitHub Issues](https://github.com/atulyaai/Tantra-IDE/issues)
- [Discussions](https://github.com/atulyaai/Tantra-IDE/discussions)

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development timeline and upcoming features.

**Current Status**: 🚧 In Development

**Upcoming**:
- Voice interface (Jarvis mode)
- Plugin system
- Cloud sync
- Collaborative editing
- Mobile companion app

## ⭐ Star History

If you find this project useful, please consider giving it a star!

---

**Built with ❤️ by the Tantra IDE Team**

[Website](https://tantra-ide.dev) • [Twitter](https://twitter.com/tantra_ide) • [Discord](https://discord.gg/tantra-ide)


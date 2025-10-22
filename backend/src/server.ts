import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Routes
import filesRouter from './routes/files.js';
import ollamaRouter from './routes/ollama.js';
import gitRouter from './routes/git.js';
import packagesRouter from './routes/packages.js';
import securityRouter from './routes/security.js';
import mediaRouter from './routes/media.js';
import deploymentRouter from './routes/deployment.js';
import searchRouter from './routes/search.js';
import performanceRouter from './routes/performance.js';
import databaseRouter from './routes/database.js';
import agentRouter from './routes/agent.js';

// Services
import { setupTerminalHandlers } from './services/terminalService.js';
import { setupOllamaHandlers } from './services/ollamaService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/files', filesRouter);
app.use('/api/ollama', ollamaRouter);
app.use('/api/git', gitRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/security', securityRouter);
app.use('/api/media', mediaRouter);
app.use('/api/deployment', deploymentRouter);
app.use('/api/search', searchRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/database', databaseRouter);
app.use('/api/agent', agentRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Setup handlers for different features
  setupTerminalHandlers(socket);
  setupOllamaHandlers(socket, io);

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[WebSocket] Error for ${socket.id}:`, error);
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Tantra IDE Backend Server Started    ║
╠════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(33)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}║
║  Time: ${new Date().toLocaleTimeString().padEnd(33)}║
╚════════════════════════════════════════╝
  `);
  
  console.log('✅ API Routes:');
  console.log(`   - Files:      http://localhost:${PORT}/api/files`);
  console.log(`   - Ollama:     http://localhost:${PORT}/api/ollama`);
  console.log(`   - Git:        http://localhost:${PORT}/api/git`);
  console.log(`   - Packages:   http://localhost:${PORT}/api/packages`);
  console.log(`   - Security:   http://localhost:${PORT}/api/security`);
  console.log(`   - Media:      http://localhost:${PORT}/api/media`);
  console.log(`   - Deployment: http://localhost:${PORT}/api/deployment`);
  console.log(`   - Search:     http://localhost:${PORT}/api/search`);
  console.log(`   - Performance: http://localhost:${PORT}/api/performance`);
  console.log(`   - Database:   http://localhost:${PORT}/api/database`);
  console.log(`   - Agent:      http://localhost:${PORT}/api/agent`);
  console.log('');
  console.log('✅ WebSocket: Connected');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };


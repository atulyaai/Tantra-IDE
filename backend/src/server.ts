import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// API Routes
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
import pluginsRouter from './routes/plugins.js';
import voiceRouter from './routes/voice.js';
import cloudSyncRouter from './routes/cloudSync.js';
import authRouter from './routes/auth.js';
import debugRouter from './routes/debug.js';

// Services
import { setupTerminalHandlers } from './services/terminalService.js';
import { setupOllamaHandlers } from './services/ollamaService.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { performanceMiddleware } from './middleware/performance.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:5173']
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'http://localhost:5173']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
})); // Enable CORS for all routes
app.use(express.json({ limit: '50mb' })); // Support large file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Performance monitoring
app.use(performanceMiddleware);

// API Routes registration
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
app.use('/api/plugins', pluginsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/cloud-sync', cloudSyncRouter);
app.use('/api/auth', authRouter);
app.use('/api/debug', debugRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// WebSocket connection handling
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

// Global error handling middleware
app.use(errorHandler);

// Start server with detailed startup information
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

// Graceful shutdown handling
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


require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const tasksRouter = require('./routes/tasks');
const agentsRouter = require('./routes/agents');
const logsRouter = require('./routes/logs');
const documentsRouter = require('./routes/documents');
const learningsRouter = require('./routes/learnings');
const systemRouter = require('./routes/system');
const ideasRouter = require('./routes/ideas');

// Import socket handler
const { initSocket, emitEvent } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/learnings', learningsRouter);
app.use('/api/system', systemRouter);
app.use('/api/ideas', ideasRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Anukar Control Dashboard API',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks',
      agents: '/api/agents',
      logs: '/api/logs',
      documents: '/api/documents',
      learnings: '/api/learnings',
      ideas: '/api/ideas',
      system: '/api/system',
      health: '/health'
    }
  });
});

// Internal broadcast endpoint (for activity logger)
app.post('/internal/broadcast', (req, res) => {
  const { event, data } = req.body;
  if (event && data) {
    emitEvent(event, data);
    res.json({ success: true, event });
  } else {
    res.status(400).json({ error: 'Missing event or data' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anukar-dashboard';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    console.log(`[MongoDB] Database: ${MONGODB_URI}`);
  })
  .catch((error) => {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  });

// Initialize Socket.io
initSocket(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Anukar Control Dashboard - Backend Server         ║
╠═══════════════════════════════════════════════════════════╣
║  Server:  http://localhost:${PORT}                          ║
║  WebSocket: ws://localhost:${PORT}                          ║
║  MongoDB:  ${MONGODB_URI.padEnd(40)}║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false);
    process.exit(0);
  });
});

module.exports = { app, server, io };

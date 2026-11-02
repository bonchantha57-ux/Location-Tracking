import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { setupLocationSockets } from './sockets/locationSocket.js';
import { db } from './config/firebaseAdmin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MAP TRACKING API',
    status: 'online',
    version: '2.0.0',
    timestamp: Date.now(),
    health: '/api/health'
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    database: db.isFirebase() ? 'Firebase Cloud Firestore' : 'Persistent Storage',
    message: 'MAP TRACKING Backend API is operating normally.'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin', adminRoutes);

// Setup WebSockets
setupLocationSockets(io);

// Start server on 0.0.0.0 for cloud reverse proxies
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MAP TRACKING Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 WebSocket ready on port ${PORT}`);
  console.log(`🔐 Database mode: ${db.isFirebase() ? 'Firebase Admin Cloud' : 'Local Persistent Storage'}`);
});

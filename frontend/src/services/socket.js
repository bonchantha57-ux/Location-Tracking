import { io } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const DEFAULT_SOCKET = isLocal ? 'http://localhost:5000' : 'https://location-tracking-n6br.onrender.com';
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET).replace(/\/+$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});

socket.on('connect', () => {
  console.log('⚡ Connected to MAP TRACKING real-time WebSocket backend');
});

socket.on('disconnect', () => {
  console.log('⚠️ Disconnected from location server');
});


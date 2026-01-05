/**
 * Socket.IO Client for Real-Time Updates
 *
 * Provides WebSocket connectivity for real-time inquiry/message updates.
 * Features:
 * - Automatic reconnection
 * - Cookie-based authentication (credentials included)
 * - Event subscription helpers
 * - Connection state management
 */

import { io, Socket } from 'socket.io-client';
import { refreshAccessToken } from '@/lib/apiClient';

// Socket.IO events
export interface SocketEvents {
  'inquiry:new': { inquiryId: number };
  'inquiry:updated': { inquiryId: number };
  'message:new': { inquiryId: number; messageId: number };
  'read:updated': { inquiryId: number; userId: number; role: 'user' | 'company'; lastReadMessageId: number };
  'inquiry:joined': { inquiryId: number };
  'inquiry:left': { inquiryId: number };
  'error': { message: string };
}

// Singleton socket instance
let socket: Socket | null = null;

// Connection state
let connectionListeners: Array<(connected: boolean) => void> = [];

/**
 * Get the API base URL from environment
 */
function getSocketUrl(): string {
  // In dev mode, always use localhost:3000 for Socket.IO
  // The API client uses the same base URL
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  // In production, use the API URL without /api suffix
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.trendingnow.ge';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

/**
 * Get or create the socket instance
 */
export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  const url = getSocketUrl();
  console.log('[Socket.IO] Creating socket connection to:', url);

  socket = io(url, {
    // Include cookies for authentication
    withCredentials: true,
    // Start with websocket, fallback to polling
    transports: ['websocket', 'polling'],
    // Auto-reconnect settings
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Timeout settings
    timeout: 20000,
    // Don't auto-connect - we'll connect manually
    autoConnect: false,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('[Socket.IO] Connected:', socket?.id);
    notifyConnectionListeners(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason);
    notifyConnectionListeners(false);
  });

  socket.on('connect_error', async (error) => {
    console.error('[Socket.IO] Connection error:', error.message);
    
    // If auth failed, try to refresh the token and reconnect
    if (error.message.includes('Authentication') || error.message.includes('expired')) {
      console.log('[Socket.IO] Auth failed - attempting token refresh...');
      const refreshResult = await refreshAccessToken();
      
      if (refreshResult === 'success') {
        console.log('[Socket.IO] Token refreshed, reconnecting...');
        // Socket.IO will auto-reconnect, but we can force it
        socket?.connect();
        return; // Don't notify disconnection yet, let reconnect attempt happen
      } else if (refreshResult === 'auth_failure') {
        console.error('[Socket.IO] Token refresh failed - user session expired');
        // Session is truly expired, notify disconnection
      } else {
        console.warn('[Socket.IO] Token refresh failed - network error, will retry');
        // Network error, socket.io will auto-retry
      }
    }
    
    notifyConnectionListeners(false);
  });

  socket.on('error', (data: { message: string }) => {
    console.error('[Socket.IO] Server error:', data.message);
  });

  return socket;
}

/**
 * Connect the socket
 */
export function connectSocket(): void {
  console.log('[Socket.IO] connectSocket() called');
  const s = getSocket();
  if (!s.connected) {
    console.log('[Socket.IO] Socket not connected, calling connect()...');
    s.connect();
  } else {
    console.log('[Socket.IO] Socket already connected');
  }
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Subscribe to connection state changes
 */
export function onConnectionChange(callback: (connected: boolean) => void): () => void {
  connectionListeners.push(callback);
  return () => {
    connectionListeners = connectionListeners.filter((cb) => cb !== callback);
  };
}

/**
 * Notify all connection listeners
 */
function notifyConnectionListeners(connected: boolean): void {
  connectionListeners.forEach((cb) => cb(connected));
}

/**
 * Join an inquiry room to receive real-time updates
 */
export function joinInquiry(inquiryId: number): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('inquiry:join', { inquiryId });
  }
}

/**
 * Leave an inquiry room
 */
export function leaveInquiry(inquiryId: number): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('inquiry:leave', { inquiryId });
  }
}

/**
 * Subscribe to inquiry:new events
 */
export function onInquiryNew(callback: (data: SocketEvents['inquiry:new']) => void): () => void {
  const s = getSocket();
  s.on('inquiry:new', callback);
  return () => {
    s.off('inquiry:new', callback);
  };
}

/**
 * Subscribe to message:new events
 */
export function onMessageNew(callback: (data: SocketEvents['message:new']) => void): () => void {
  const s = getSocket();
  s.on('message:new', callback);
  return () => {
    s.off('message:new', callback);
  };
}

/**
 * Subscribe to inquiry:updated events
 */
export function onInquiryUpdated(callback: (data: SocketEvents['inquiry:updated']) => void): () => void {
  const s = getSocket();
  s.on('inquiry:updated', callback);
  return () => {
    s.off('inquiry:updated', callback);
  };
}

/**
 * Subscribe to read:updated events
 */
export function onReadUpdated(callback: (data: SocketEvents['read:updated']) => void): () => void {
  const s = getSocket();
  s.on('read:updated', callback);
  return () => {
    s.off('read:updated', callback);
  };
}

/**
 * Subscribe to inquiry:joined confirmation
 */
export function onInquiryJoined(callback: (data: SocketEvents['inquiry:joined']) => void): () => void {
  const s = getSocket();
  s.on('inquiry:joined', callback);
  return () => {
    s.off('inquiry:joined', callback);
  };
}

/**
 * Socket.IO Real-Time Server
 *
 * Provides WebSocket connectivity for real-time inquiry/message updates.
 * Features:
 * - Cookie-based authentication (same as HTTP)
 * - Redis adapter for PM2 cluster mode
 * - Room-based messaging (user, company, inquiry)
 * - Rate limiting for spam prevention
 */

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import type http from 'http';
import { SessionService } from '../services/SessionService.js';
import { UserModel } from '../models/UserModel.js';
import { InquiryModel } from '../models/InquiryModel.js';
import { ACCESS_TOKEN_COOKIE } from '../config/auth.js';
import type { UserRole } from '../types/user.js';

// Socket user data attached after authentication
export interface SocketUser {
  id: number;
  username: string;
  role: UserRole;
  company_id: number | null;
}

// Socket data interface
interface SocketData {
  user?: SocketUser;
}

// Rate limiting state per socket
interface RateLimitState {
  count: number;
  resetAt: number;
}

// Global Socket.IO instance
let io: SocketIOServer | null = null;

// Redis clients for adapter
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_EVENTS = 50; // max events per window

/**
 * Parse cookies from cookie header string
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });

  return cookies;
}

/**
 * Initialize Socket.IO server with Fastify
 */
export async function initializeSocketIO(
  fastify: FastifyInstance,
  httpServer: http.Server
): Promise<SocketIOServer> {
  const isProd = process.env.NODE_ENV === 'production';

  // Get allowed origins from env
  const rawCorsOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
  const allowedOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Create Socket.IO server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: isProd
        ? allowedOrigins.length > 0
          ? allowedOrigins
          : false
        : true, // Allow all in dev
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Connection settings
    pingTimeout: 20000,
    pingInterval: 25000,
    // Transports
    transports: ['websocket', 'polling'],
    // Allow upgrades from polling to websocket
    allowUpgrades: true,
  });

  // Setup Redis adapter for PM2 cluster mode
  await setupRedisAdapter(fastify);

  // Setup authentication middleware
  setupAuthMiddleware(fastify);

  // Setup event handlers
  setupEventHandlers(fastify);

  fastify.log.info('Socket.IO server initialized');

  return io;
}

/**
 * Setup Redis adapter for cross-worker communication
 */
async function setupRedisAdapter(fastify: FastifyInstance): Promise<void> {
  if (!io) return;

  // Check if Redis is available
  const redisHost = process.env.REDIS_HOST ?? '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = parseInt(process.env.REDIS_DB ?? '0', 10);

  try {
    // Create dedicated pub/sub clients for Socket.IO adapter
    const redisOptions = {
      host: redisHost,
      port: redisPort,
      ...(redisPassword && { password: redisPassword }),
      db: redisDb,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    };

    pubClient = new Redis(redisOptions);
    subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    fastify.log.info('Socket.IO Redis adapter initialized');
  } catch (err) {
    fastify.log.warn({ err }, 'Socket.IO Redis adapter failed, running without cluster support');
    // Cleanup failed clients
    if (pubClient) {
      pubClient.disconnect();
      pubClient = null;
    }
    if (subClient) {
      subClient.disconnect();
      subClient = null;
    }
  }
}

/**
 * Cleanup Socket.IO resources (call on server shutdown)
 */
export async function cleanupSocketIO(): Promise<void> {
  if (pubClient) {
    await pubClient.quit().catch(() => {});
    pubClient = null;
  }
  if (subClient) {
    await subClient.quit().catch(() => {});
    subClient = null;
  }
  if (io) {
    io.close();
    io = null;
  }
}

/**
 * Setup authentication middleware for socket connections
 */
function setupAuthMiddleware(fastify: FastifyInstance): void {
  if (!io) return;

  const sessionService = new SessionService(fastify);
  const userModel = new UserModel(fastify);

  io.use(async (socket, next) => {
    try {
      // Parse cookies from handshake
      const cookieHeader = socket.handshake.headers.cookie;
      fastify.log.info({ 
        hasCookies: !!cookieHeader,
        socketId: socket.id,
        origin: socket.handshake.headers.origin,
        transport: socket.conn.transport.name,
      }, 'Socket auth middleware - checking cookies');
      const cookies = parseCookies(cookieHeader);
      const accessToken = cookies[ACCESS_TOKEN_COOKIE];

      if (!accessToken) {
        fastify.log.warn({ 
          socketId: socket.id,
          cookieKeys: Object.keys(cookies),
        }, 'Socket auth failed: no access token in cookies');
        return next(new Error('Authentication required'));
      }

      // Verify access token
      const payload = sessionService.verifyAccessToken(accessToken);
      if (!payload) {
        return next(new Error('Invalid or expired token'));
      }

      // Get user from database
      const user = await userModel.findById(payload.sub);
      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.is_blocked) {
        return next(new Error('Account is blocked'));
      }

      // Attach user to socket
      socket.data.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
      };

      next();
    } catch (err) {
      fastify.log.error({ err }, 'Socket authentication error');
      next(new Error('Authentication failed'));
    }
  });
}

/**
 * Setup socket event handlers
 */
function setupEventHandlers(fastify: FastifyInstance): void {
  if (!io) return;

  const inquiryModel = new InquiryModel(fastify);

  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (!user) {
      fastify.log.warn({ socketId: socket.id }, 'Socket connected but no user data, disconnecting');
      socket.disconnect(true);
      return;
    }

    fastify.log.info({ userId: user.id, socketId: socket.id, username: user.username }, 'Socket connected');

    // Rate limiting state
    const rateLimit: RateLimitState = {
      count: 0,
      resetAt: Date.now() + RATE_LIMIT_WINDOW_MS,
    };

    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Join company room if user has a company
    if (user.company_id) {
      socket.join(`company:${user.company_id}`);
    }

    // Handle inquiry:join - join an inquiry room
    socket.on('inquiry:join', async (data: { inquiryId: number }) => {
      if (!checkRateLimit(rateLimit)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      try {
        const { inquiryId } = data;
        if (!inquiryId || typeof inquiryId !== 'number') {
          socket.emit('error', { message: 'Invalid inquiry ID' });
          return;
        }

        // Verify user has access to this inquiry
        const hasAccess = await verifyInquiryAccess(inquiryModel, inquiryId, user);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to inquiry' });
          return;
        }

        socket.join(`inquiry:${inquiryId}`);
        socket.emit('inquiry:joined', { inquiryId });

        fastify.log.debug({ userId: user.id, inquiryId }, 'User joined inquiry room');
      } catch (err) {
        fastify.log.error({ err }, 'Error joining inquiry room');
        socket.emit('error', { message: 'Failed to join inquiry' });
      }
    });

    // Handle inquiry:leave - leave an inquiry room
    socket.on('inquiry:leave', (data: { inquiryId: number }) => {
      if (!checkRateLimit(rateLimit)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      const { inquiryId } = data;
      if (!inquiryId || typeof inquiryId !== 'number') {
        return;
      }

      socket.leave(`inquiry:${inquiryId}`);
      socket.emit('inquiry:left', { inquiryId });

      fastify.log.debug({ userId: user.id, inquiryId }, 'User left inquiry room');
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      fastify.log.debug({ userId: user.id, socketId: socket.id, reason }, 'Socket disconnected');
    });
  });
}

/**
 * Check rate limit for a socket
 */
function checkRateLimit(state: RateLimitState): boolean {
  const now = Date.now();

  // Reset if window expired
  if (now >= state.resetAt) {
    state.count = 0;
    state.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  state.count++;
  return state.count <= RATE_LIMIT_MAX_EVENTS;
}

/**
 * Verify user has access to an inquiry
 */
async function verifyInquiryAccess(
  inquiryModel: InquiryModel,
  inquiryId: number,
  user: SocketUser
): Promise<boolean> {
  const inquiry = await inquiryModel.findById(inquiryId);
  if (!inquiry) return false;

  // User can access if they created the inquiry
  if (inquiry.user_id === user.id) return true;

  // Company user can access if inquiry is for their company
  if (user.company_id && inquiry.company_id === user.company_id) return true;

  return false;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Get Redis adapter status
 */
export function getRedisAdapterStatus(): {
  enabled: boolean;
  pub: string;
  sub: string;
} {
  return {
    enabled: pubClient !== null && subClient !== null,
    pub: pubClient?.status ?? 'disconnected',
    sub: subClient?.status ?? 'disconnected',
  };
}

/**
 * Get socket stats for health check
 */
export function getSocketStats(): {
  connected: number;
  rooms: number;
  namespace: string;
} {
  if (!io) {
    return { connected: 0, rooms: 0, namespace: '/' };
  }

  const mainNamespace = io.of('/');
  return {
    connected: mainNamespace.sockets.size,
    rooms: mainNamespace.adapter.rooms.size,
    namespace: '/',
  };
}

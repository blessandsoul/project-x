import fp from 'fastify-plugin';
import jwt, { SignOptions } from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload, UserRole } from '../types/user.js';
import { AuthenticationError } from '../types/errors.js';
import { UserModel } from '../models/UserModel.js';
import { getFromCache, setInCache } from '../utils/cache.js';

// Cache user data for 5 minutes to reduce DB load on auth
const USER_CACHE_TTL = 300;

/**
 * Authentication Plugin
 *
 * Provides JWT-based authentication for the Fastify application.
 * Includes token verification, user authentication middleware,
 * and token generation utilities.
 *
 * Features:
 * - JWT token verification and validation
 * - Authentication middleware for protected routes
 * - Token generation with configurable expiration
 * - Environment variable validation for security
 */
const ENV_JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Default 7 days
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;

if (!ENV_JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Validate JWT_SECRET strength in production
if (process.env.NODE_ENV === 'production' && ENV_JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

const JWT_SECRET: string = ENV_JWT_SECRET;

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateToken: (payload: Omit<JWTPayload, 'iat' | 'exp'>) => string;
  }
}

const authPlugin = fp(async (fastify) => {
  /**
   * Verify and decode JWT token
   *
   * Validates JWT token signature and extracts payload data.
   * Used internally by the authentication middleware.
   *
   * @param token - JWT token string to verify
   * @returns Decoded JWT payload with user information
   * @throws Error if token is invalid or expired
   */
  const verifyToken = (token: string): JWTPayload => {
    try {
      return jwt.verify(token, JWT_SECRET, {
        // Only enforce issuer/audience if they are configured
        issuer: JWT_ISSUER || undefined,
        audience: JWT_AUDIENCE || undefined,
      }) as unknown as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  };

  // Authentication hook
  /**
   * Authentication middleware for protected routes
   *
   * Extracts and validates JWT token from Authorization header,
   * decodes user information, and attaches it to the request object.
   * Should be used as preHandler in route definitions.
   *
   * @param request - Fastify request object
   * @param reply - Fastify reply object
   * @throws Sends 401 response if authentication fails
   */
  const userModel = new UserModel(fastify);

	  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      const altHeader = (request.headers as Record<string, string | string[] | undefined>)['x-access-token'];

      let token: string | undefined;

      // Prefer standard Authorization header
      if (typeof authHeader === 'string' && authHeader.length > 0) {
        token = authHeader.startsWith('Bearer ')
          ? authHeader.substring(7) // Remove 'Bearer ' prefix
          : authHeader; // Allow raw token without Bearer
      } else if (typeof altHeader === 'string' && altHeader.length > 0) {
        // Fallback to x-access-token header if provided
        token = altHeader;
      }

      if (!token) {
        return reply.code(401).send({ error: 'Access token required' });
      }

      const decoded = verifyToken(token);

      // Try to get user from cache first to reduce DB load
      const cacheKey = `user:auth:${decoded.userId}`;
      let dbUser = await getFromCache<{
        id: number;
        email: string;
        username: string;
        role: UserRole;
        company_id: number | null;
        is_blocked: boolean;
      }>(fastify, cacheKey);

      if (!dbUser) {
        // Cache miss - load from DB
        const freshUser = await userModel.findById(decoded.userId);
        if (!freshUser) {
          throw new AuthenticationError('User not found');
        }

        // Cache the user data (only essential fields)
        dbUser = {
          id: freshUser.id,
          email: freshUser.email,
          username: freshUser.username,
          role: freshUser.role,
          company_id: freshUser.company_id,
          is_blocked: freshUser.is_blocked,
        };
        await setInCache(fastify, cacheKey, dbUser, USER_CACHE_TTL);
      }

      if (dbUser.is_blocked) {
        throw new AuthenticationError('Account is blocked');
      }

      // Add user to request object (including role and company_id for authorization checks).
      request.user = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        company_id: dbUser.company_id,
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return reply.code(401).send({ error: message });
    }
  });

  // Helper function to generate JWT token
  /**
   * Generate JWT token for authenticated user
   *
   * Creates a signed JWT token with user information and standard claims.
   * Token expires after 7 days by default.
   *
   * @param payload - User data to encode in token (userId, email, username)
   * @returns Signed JWT token string
   */
  fastify.decorate('generateToken', (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN, // Always set expiration (e.g., '7d')
      issuer: JWT_ISSUER || undefined,
      audience: JWT_AUDIENCE || undefined,
    } as SignOptions);
  });
});

export { authPlugin };

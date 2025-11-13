import fp from 'fastify-plugin';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload, AuthUser } from '../types/user.js';
import { AuthenticationError } from '../types/errors.js';

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
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

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
      return jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
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
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Access token required' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const decoded = verifyToken(token);

      // Add user to request object
      request.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
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
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  });
});

export { authPlugin };

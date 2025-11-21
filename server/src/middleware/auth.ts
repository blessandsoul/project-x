import fp from 'fastify-plugin';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload, AuthUser } from '../types/user.js';
import { AuthenticationError } from '../types/errors.js';
import { UserModel } from '../models/UserModel.js';

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
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;

if (!ENV_JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
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

	      // Load the latest user record to enforce is_blocked and role from DB.
	      const dbUser = await userModel.findById(decoded.userId);
	      if (!dbUser) {
	        throw new AuthenticationError('User not found');
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
    const options: SignOptions = {
      issuer: JWT_ISSUER || undefined,
      audience: JWT_AUDIENCE || undefined,
    };

    if (JWT_EXPIRES_IN) {
      (options as any).expiresIn = JWT_EXPIRES_IN;
    }

    return jwt.sign(payload, JWT_SECRET, options);
  });
});

export { authPlugin };

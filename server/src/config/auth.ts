import fp from 'fastify-plugin';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload, AuthUser } from '../types/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateToken: (payload: Omit<JWTPayload, 'iat' | 'exp'>) => string;
  }
}

const authPlugin = fp(async (fastify) => {
  // JWT verification function
  const verifyToken = (token: string): JWTPayload => {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  };

  // Authentication hook
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
  fastify.decorate('generateToken', (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  });
});

export { authPlugin };

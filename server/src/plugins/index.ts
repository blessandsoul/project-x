/**
 * Plugin Registration
 *
 * Registers all Fastify plugins including security, compression, documentation,
 * database, authentication, and middleware plugins.
 *
 * @module plugins
 */

import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyCookie from '@fastify/cookie';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';

import { databasePlugin } from '../config/database.js';
import { redisPlugin } from '../config/redis.js';
import { authPlugin } from '../middleware/auth.js';
import { authCookiePlugin } from '../middleware/authCookie.js';
import { csrfPlugin } from '../middleware/csrf.js';
import { requireAdminPlugin } from '../middleware/requireAdmin.js';
import { errorHandlerPlugin } from '../middleware/errorHandler.js';
import {
    isProd,
    allowedOrigins,
    allowCorsCredentials,
    globalRateLimitMax,
    globalRateLimitWindow,
} from '../config/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Register all Fastify plugins
 *
 * Plugins are registered in a specific order to ensure proper initialization:
 * 1. Compression - for response optimization
 * 2. Swagger (dev only) - API documentation
 * 3. Security (Helmet, CORS, Rate Limit)
 * 4. Request handling (Cookie, Sensible, Multipart, Static)
 * 5. Database & Redis
 * 6. Authentication & Authorization
 * 7. Error handling
 *
 * @param fastify - Fastify instance to register plugins on
 */
export async function registerPlugins(fastify: FastifyInstance): Promise<void> {
    // ---------------------------------------------------------------------------
    // Response compression for better performance
    // ---------------------------------------------------------------------------
    await fastify.register(fastifyCompress, {
        global: true,
        encodings: ['gzip', 'deflate'],
    });

    // ---------------------------------------------------------------------------
    // OpenAPI/Swagger documentation - only in development
    // ---------------------------------------------------------------------------
    if (!isProd) {
        await fastify.register(fastifySwagger, {
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'Project-X API',
                    description: 'API documentation for Project-X server',
                    version: '1.0.0',
                },
                servers: [
                    {
                        url: `http://localhost:${process.env.PORT || 3000}`,
                        description: 'Development server',
                    },
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
                tags: [
                    { name: 'Health', description: 'Health check endpoints' },
                    { name: 'Users', description: 'User authentication and profile management' },
                    { name: 'Companies', description: 'Company management and search' },
                    { name: 'Vehicles', description: 'Vehicle catalog and VIN decoding' },
                    { name: 'Favorites', description: 'User favorites management' },
                    { name: 'Dashboard', description: 'Dashboard statistics' },
                ],
            },
        });

        await fastify.register(fastifySwaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: true,
            },
        });
    }

    // ---------------------------------------------------------------------------
    // Security: Helmet for HTTP headers
    // ---------------------------------------------------------------------------
    // Allow static assets (e.g., company logos) to be embedded from other origins
    // such as the SPA dev server (localhost:5173) by relaxing the
    // Cross-Origin-Resource-Policy header.
    await fastify.register(helmet, {
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },
        // Configure CSP to allow WebSocket connections for Socket.IO
        contentSecurityPolicy: isProd
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    connectSrc: ["'self'", 'wss:', 'ws:'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                },
            }
            : false, // Disable CSP in development for easier debugging
    });

    // ---------------------------------------------------------------------------
    // Security: CORS configuration
    // ---------------------------------------------------------------------------
    await fastify.register(cors, {
        // Allow only explicitly configured origins in production; allow all in development
        origin: (origin, cb) => {
            // Allow non-browser clients (no Origin header) - Postman/curl always work
            if (!origin) {
                cb(null, true);
                return;
            }

            // If explicit origins are configured, check against allowlist
            if (allowedOrigins.length > 0) {
                if (allowedOrigins.includes(origin)) {
                    cb(null, true);
                    return;
                }
                cb(new Error('Origin not allowed by CORS'), false);
                return;
            }

            // No explicit origins configured
            if (isProd) {
                // PRODUCTION: Deny browser requests if CORS_ALLOWED_ORIGINS not set
                fastify.log.warn({
                    event: 'cors_denied_no_config',
                    origin,
                }, 'CORS denied: CORS_ALLOWED_ORIGINS not configured in production');
                cb(new Error('Origin not allowed by CORS'), false);
                return;
            }

            // DEVELOPMENT: Allow any origin for developer convenience
            cb(null, true);
        },
        credentials: allowCorsCredentials,
        // Explicitly allow all HTTP methods we use from the SPA
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    // ---------------------------------------------------------------------------
    // Request handling plugins
    // ---------------------------------------------------------------------------
    await fastify.register(fastifyCookie);
    await fastify.register(fastifySensible);

    await fastify.register(fastifyMultipart, {
        limits: {
            fileSize: 2 * 1024 * 1024, // 2 MiB max per file (avatar limit)
            files: 1,
        },
    });

    // ---------------------------------------------------------------------------
    // Static file serving (uploads directory)
    // ---------------------------------------------------------------------------
    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '..', '..', 'uploads'),
        prefix: '/uploads/',
        // Enable CORS and CORP headers for static assets
        setHeaders: (res, _path) => {
            // CRITICAL: Cross-Origin-Resource-Policy must be set for static assets
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            // CORS: Allow cross-origin requests from any origin for public images
            res.setHeader('Access-Control-Allow-Origin', '*');
            // Remove CSP for static assets - images don't need CSP protection
            (res as any).removeHeader('Content-Security-Policy');
            // Cache static assets for 1 day in production, no cache in dev
            if (isProd) {
                res.setHeader('Cache-Control', 'public, max-age=86400');
            } else {
                res.setHeader('Cache-Control', 'no-cache');
            }
        },
    });

    // ---------------------------------------------------------------------------
    // Security: Rate limiting
    // ---------------------------------------------------------------------------
    await fastify.register(rateLimit, {
        max: globalRateLimitMax,
        timeWindow: globalRateLimitWindow,
        allowList: [],
    });

    // ---------------------------------------------------------------------------
    // Database & Cache
    // ---------------------------------------------------------------------------
    await fastify.register(databasePlugin);
    await fastify.register(redisPlugin);

    // ---------------------------------------------------------------------------
    // Authentication & Authorization
    // ---------------------------------------------------------------------------
    await fastify.register(authPlugin);
    await fastify.register(authCookiePlugin);
    await fastify.register(csrfPlugin);
    await fastify.register(requireAdminPlugin);

    // ---------------------------------------------------------------------------
    // Error handling (must be registered last)
    // ---------------------------------------------------------------------------
    await fastify.register(errorHandlerPlugin);

    fastify.log.debug('All plugins registered');
}

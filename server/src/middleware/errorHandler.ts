import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../types/errors.js';

/**
 * Error Handling Plugin
 *
 * Provides centralized error handling for the Fastify application.
 * Converts various error types to consistent HTTP responses with
 * appropriate status codes and error messages.
 *
 * SECURITY: This handler ensures that:
 * - All validation/schema errors return HTTP 400 (never 500)
 * - Database errors are masked and never expose internal details
 * - Stack traces are only shown in development
 *
 * Features:
 * - Structured error responses
 * - Custom error class handling
 * - Database error sanitization
 * - Request logging for errors
 * - Development vs production error details
 */

/**
 * Check if error is a Fastify validation error (from JSON schema validation)
 * These errors occur when request params, query, or body fail schema validation
 */
function isFastifyValidationError(error: Error | FastifyError): boolean {
  const fastifyError = error as FastifyError;
  
  // Fastify schema validation errors have specific codes
  if (fastifyError.code === 'FST_ERR_VALIDATION') {
    return true;
  }
  
  // Check for validation property (Fastify adds this for schema errors)
  if ('validation' in fastifyError && Array.isArray((fastifyError as any).validation)) {
    return true;
  }
  
  // Check for validationContext (params, querystring, body, headers)
  if ('validationContext' in fastifyError) {
    return true;
  }
  
  // Check statusCode - Fastify sets 400 for validation errors
  if (fastifyError.statusCode === 400) {
    return true;
  }
  
  return false;
}

/**
 * Check if error is a database-related error that should be masked
 */
function isDatabaseError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const errorPatterns = [
    'er_',           // MySQL error codes (ER_DUP_ENTRY, ER_NO_SUCH_TABLE, etc.)
    'econnrefused',  // Connection refused
    'enotfound',     // DNS lookup failed
    'etimedout',     // Connection timeout
    'sql',           // SQL-related errors
    'mysql',         // MySQL-specific errors
    'prisma',        // Prisma ORM errors
    'database',      // Generic database errors
    'query',         // Query errors
    'connection',    // Connection errors
  ];
  
  return errorPatterns.some(pattern => message.includes(pattern));
}

const errorHandlerPlugin = fp(async (fastify) => {
  /**
   * Global error handler
   *
   * Processes all errors thrown during request handling and
   * converts them to appropriate HTTP responses.
   *
   * SECURITY PRIORITY ORDER:
   * 1. Fastify schema validation errors → 400 (MUST be first to catch malformed input)
   * 2. Custom application errors → appropriate status code
   * 3. JWT errors → 401
   * 4. Database errors → 500 with masked message
   * 5. All other errors → 500 with masked message
   */
  fastify.setErrorHandler((error: Error | FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // If a response was already sent (e.g. by auth/preValidation), never try to send again.
    // This can happen under scanners/proxies that trigger edge cases or aborts.
    if (reply.sent || request.raw.aborted) {
      return;
    }

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    // SECURITY: Handle Fastify schema validation errors FIRST
    // This catches malformed path params, query strings, and bodies
    // Examples: /admin/users/10%3B, /companies/%27, etc.
    if (isFastifyValidationError(error)) {
      statusCode = 400;
      errorCode = 'INVALID_REQUEST';
      message = 'Invalid request parameters';
    }
    // Handle custom application errors
    else if (error instanceof AppError) {
      statusCode = error.statusCode;
      errorCode = error.errorCode;
      message = error.message;
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    }
    else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      errorCode = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
    }
    // Handle rate limit errors - return 429 instead of 500
    else if (error.message.includes('Rate limit exceeded')) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      message = error.message;
    }
    // Handle Fastify JSON body parse errors explicitly to avoid generic 500s
    else if (error.message.includes('Body is not valid JSON')) {
      statusCode = 400;
      errorCode = 'BAD_REQUEST_BODY';
      message = 'Body is not valid JSON but content-type is application/json';
    }
    // Handle other known client errors
    else if (error.name === 'SyntaxError') {
      statusCode = 400;
      errorCode = 'BAD_REQUEST';
      message = 'Invalid request format';
    }
    // SECURITY: Handle database errors - NEVER expose internal details
    else if (isDatabaseError(error)) {
      // Check for specific known cases that have user-friendly messages
      if (error.message.includes('ER_DUP_ENTRY')) {
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
        message = 'Resource already exists';
      } else {
        // All other database errors get a generic 500 response
        statusCode = 500;
        errorCode = 'INTERNAL_ERROR';
        message = 'An internal error occurred. Please try again later.';
      }
    }

    // Log error details for debugging
    const logData = {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    };

    if (statusCode >= 500) {
      fastify.log.error(logData, 'Server error occurred');
    } else {
      fastify.log.warn(logData, 'Client error occurred');
    }

    // Prepare error response
    const errorResponse: any = {
      error: {
        code: errorCode,
        message: message,
        timestamp: new Date().toISOString()
      }
    };

    // Include additional error details in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.details = error.message;
      if (error.stack) {
        errorResponse.error.stack = error.stack.split('\n');
      }
    }

    return reply.code(statusCode).send(errorResponse);
  });

  /**
   * Handle unhandled promise rejections
   */
  process.on('unhandledRejection', (reason, promise) => {
    fastify.log.error({ reason, promise }, 'Unhandled promise rejection');
  });

  /**
   * Handle uncaught exceptions
   */
  process.on('uncaughtException', (error) => {
    fastify.log.error({ error }, 'Uncaught exception');
    process.exit(1);
  });
});

export { errorHandlerPlugin };

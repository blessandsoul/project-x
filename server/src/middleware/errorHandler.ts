import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
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
 * Features:
 * - Structured error responses
 * - Custom error class handling
 * - Database error sanitization
 * - Request logging for errors
 * - Development vs production error details
 */

const errorHandlerPlugin = fp(async (fastify) => {
  /**
   * Global error handler
   *
   * Processes all errors thrown during request handling and
   * converts them to appropriate HTTP responses.
   */
  fastify.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    // Handle custom application errors
    if (error instanceof AppError) {
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
    // Handle validation errors (from fastify schemas)
    else if (error.name === 'ValidationError' || error.message.includes('validation')) {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Request validation failed';
    }
    // Handle database errors
    else if (error.message.includes('ER_DUP_ENTRY')) {
      statusCode = 409;
      errorCode = 'DUPLICATE_ENTRY';
      message = 'Resource already exists';
    }
    else if (error.message.includes('ER_NO_SUCH_TABLE')) {
      statusCode = 500;
      errorCode = 'DATABASE_ERROR';
      message = 'Database configuration error';
    }
    // Handle Fastify JSON body parse errors explicitly to avoid generic 500s
    else if (error.message.includes('Body is not valid JSON')) {
      statusCode = 400;
      errorCode = 'BAD_REQUEST_BODY';
      message = 'Body is not valid JSON but content-type is application/json';
    }
    // Handle other known errors
    else if (error.name === 'SyntaxError') {
      statusCode = 400;
      errorCode = 'BAD_REQUEST';
      message = 'Invalid request format';
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

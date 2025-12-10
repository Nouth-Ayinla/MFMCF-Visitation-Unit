import { Request, Response, NextFunction } from 'express';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@shared/errors';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', error);

  // Authentication errors
  if (error instanceof AuthenticationError) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: error.message,
      },
    });
    return;
  }

  // Validation errors
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
    return;
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    });
    return;
  }

  // Conflict errors (duplicate, etc.)
  if (error instanceof ConflictError) {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: error.message,
      },
    });
    return;
  }

  // Forbidden errors
  if (error instanceof ForbiddenError) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: error.message,
      },
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
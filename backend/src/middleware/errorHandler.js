const { errorResponse } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Global error handler middleware for Express.
 */
function errorHandler(err, req, res, next) {
  // If it's our custom AppError, use its properties
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.errorCode, err.message, err.details)
    );
  }

  // Handle specific known errors (like Zod validation)
  if (err.name === 'ZodError') {
    return res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'Invalid request parameters.', err.errors)
    );
  }

  // Catch-all for unexpected errors
  console.error('Unhandled Error:', err);
  
  // Don't leak stack traces to the client
  return res.status(500).json(
    errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.')
  );
}

module.exports = errorHandler;

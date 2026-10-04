/**
 * Custom error class for application errors to differentiate from system errors.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Indicates it's a known/expected error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

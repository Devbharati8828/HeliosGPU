const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/response');

/**
 * Standard API rate limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(
      errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.')
    );
  }
});

/**
 * Stricter limiter for external integrations to prevent abuse.
 */
const externalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit to 20 per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(
      errorResponse('EXTERNAL_RATE_LIMIT', 'Too many requests to external services.')
    );
  }
});

module.exports = {
  apiLimiter,
  externalApiLimiter
};

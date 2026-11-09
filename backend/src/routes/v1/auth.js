'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../../utils/response');
const authController = require('../../controllers/authController');
const requireAuth = require('../../middleware/requireAuth');

const router = express.Router();

// Stricter rate limiter: 5 requests per 15 minutes per IP on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(
      errorResponse('RATE_LIMIT_EXCEEDED', 'Too many attempts, please try again later.')
    );
  },
});

// Apply stricter limiter to login and register
router.post('/register', authLimiter, authController.register);
router.post('/login',    authLimiter, authController.login);
router.post('/refresh',               authController.refresh);
router.post('/logout',                authController.logout);
router.get('/me',        requireAuth, authController.me);

module.exports = router;


'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * requireAuth — verifies the access_token cookie.
 * Sets req.user = { id, email, name } on success.
 * Returns 401 on failure.
 */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.access_token;
  if (!token) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'));
  }
}

module.exports = requireAuth;


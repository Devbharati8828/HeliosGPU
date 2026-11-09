'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * optionalAuth — same as requireAuth but never blocks the request.
 * Sets req.user = { id, email, name } if a valid token is present,
 * otherwise sets req.user = null and continues.
 */
function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies.access_token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    req.user = null;
  }
  next();
}

module.exports = optionalAuth;


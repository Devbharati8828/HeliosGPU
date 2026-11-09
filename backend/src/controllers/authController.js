'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const pool = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/response');

// ── Validation schemas ────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  name: z.string().min(1).max(255).optional(),
});

const LoginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

// ── Cookie helpers ────────────────────────────────────────────────────────────

const ACCESS_MAX_AGE  = 15 * 60 * 1000;          // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function cookieOpts(maxAge) {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    maxAge,
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token',  accessToken,  cookieOpts(ACCESS_MAX_AGE));
  res.cookie('refresh_token', refreshToken, {
    ...cookieOpts(REFRESH_MAX_AGE),
    path: '/api/v1/auth/refresh', // scope refresh cookie to refresh endpoint
  });
}

function clearAuthCookies(res) {
  const base = { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAMESITE };
  res.clearCookie('access_token',  base);
  res.clearCookie('refresh_token', { ...base, path: '/api/v1/auth/refresh' });
}

// ── Token generators ──────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name },
    env.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { jti: uuidv4() },
    env.JWT_REFRESH_SECRET,
    { subject: user.id, expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId, refreshToken) {
  // Decode to get expiry without verifying (we just created it)
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
    [uuidv4(), userId, hashToken(refreshToken), expiresAt]
  );
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg =
        (parsed.error.issues && parsed.error.issues[0]?.message) ||
        (parsed.error.errors && parsed.error.errors[0]?.message) ||
        'Validation error';
      throw new AppError(msg, 400, 'VALIDATION_ERROR');
    }
    const { email, password, name } = parsed.data;

    // Check duplicate
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new AppError('Email already in use', 409, 'EMAIL_CONFLICT');
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`,
      [id, email, password_hash, name || null]
    );

    const user = { id, email, name: name || null };
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(id, refreshToken);

    setAuthCookies(res, accessToken, refreshToken);
    return res.status(201).json(successResponse({ id, email, name: user.name }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    const { email, password } = parsed.data;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    // Use a constant-time comparison even when user not found (bcrypt dummy)
    const dummyHash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const hash = rows.length > 0 ? rows[0].password_hash : dummyHash;
    const match = await bcrypt.compare(password, hash);

    if (rows.length === 0 || !match) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = rows[0];

    // Prune expired refresh tokens for this user
    await pool.query(
      `DELETE FROM refresh_tokens WHERE user_id = ? AND (expires_at < NOW() OR revoked = TRUE)`,
      [user.id]
    );

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);

    setAuthCookies(res, accessToken, refreshToken);
    return res.json(successResponse({ id: user.id, email: user.email, name: user.name }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Cookie path is scoped to this route.
 */
exports.refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies && req.cookies.refresh_token;
    if (!rawToken) {
      throw new AppError('Refresh token missing', 401, 'UNAUTHORIZED');
    }

    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }

    const tokenHash = hashToken(rawToken);
    const [rows] = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = FALSE AND expires_at > NOW()`,
      [tokenHash]
    );
    if (rows.length === 0) {
      throw new AppError('Refresh token invalid or already used', 401, 'UNAUTHORIZED');
    }

    // Rotate: delete old, issue new
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [payload.sub]);
    if (userRows.length === 0) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }
    const user = userRows[0];

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);

    setAuthCookies(res, accessToken, refreshToken);
    return res.json(successResponse({ id: user.id, email: user.email, name: user.name }));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies && req.cookies.refresh_token;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?',
        [tokenHash]
      );
    }
    clearAuthCookies(res);
    return res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me  (requireAuth)
 */
exports.me = async (req, res, next) => {
  try {
    return res.json(successResponse({ id: req.user.id, email: req.user.email, name: req.user.name }));
  } catch (err) {
    next(err);
  }
};


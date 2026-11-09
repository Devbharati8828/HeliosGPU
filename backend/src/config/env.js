'use strict';
/**
 * Validated environment configuration.
 * Server refuses to start in production when secrets are missing or too short.
 */

require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

function requireEnv(name, minLength = 0) {
  const val = process.env[name];
  if (!val) {
    if (isProd) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    // In dev, warn but allow startup with a placeholder
    console.warn(`[env] WARNING: ${name} is not set. Auth will not function correctly.`);
    return '';
  }
  if (isProd && val.length < minLength) {
    throw new Error(
      `Environment variable ${name} must be at least ${minLength} characters in production.`
    );
  }
  if (val.length > 0 && val.length < minLength) {
    console.warn(`[env] WARNING: ${name} is shorter than the recommended ${minLength} characters.`);
  }
  return val;
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'heliosgpu',

  // Auth secrets — require ≥32 chars in production
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET', 32),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET', 32),

  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true' || isProd,
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || 'lax',

  // CORS — never '*'
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};


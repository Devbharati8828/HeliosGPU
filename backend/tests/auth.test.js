/**
 * Auth integration tests (Vitest + Supertest).
 * Tests all 10 requirements against real MySQL.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import initDB from '../src/models/init.js';

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await initDB();
  await pool.query("DELETE FROM users WHERE email LIKE 'test+%@helios.test'");
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'test+%@helios.test'");
  await pool.end();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

let ipCounter = 1;
function nextIp() {
  return `192.168.10.${ipCounter++}`;
}

const PASS = 'Password123!';

// Helper to extract error message/code from errorResponse format
function getError(res) {
  return res.body.error || {};
}

// ── Test 1: POST /auth/register -> 201, cookies set ───────────────────────────
describe('1. POST /api/v1/auth/register', () => {
  const ip = nextIp();
  const email = `test+reg_${Date.now()}@helios.test`;

  it('creates user and sets httpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Register User' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.name).toBe('Register User');

    const cookies = res.headers['set-cookie'] || [];
    const cookieStr = cookies.join(';');
    expect(cookieStr).toMatch(/access_token/);
    expect(cookieStr).toMatch(/refresh_token/);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });
});

// ── Test 2: Duplicate email -> 409 ───────────────────────────────────────────
describe('2. Duplicate email registration', () => {
  const ip = nextIp();
  const email = `test+dup_${Date.now()}@helios.test`;

  it('returns 409 on duplicate email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'First' })
      .expect(201);

    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Second' })
      .expect(409);

    expect(dupRes.body.success).toBe(false);
    expect(getError(dupRes).code).toBe('EMAIL_CONFLICT');
  });
});

// ── Test 3: Weak password (< 8 chars) -> 400 ───────────────────────────────────
describe('3. Weak password validation', () => {
  const ip = nextIp();

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email: `test+weak_${Date.now()}@helios.test`, password: 'short' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(getError(res).message).toMatch(/at least 8 characters/i);
  });
});

// ── Test 4: POST /auth/login ok -> 200, cookies ──────────────────────────────
describe('4. POST /api/v1/auth/login', () => {
  const ip = nextIp();
  const email = `test+login_${Date.now()}@helios.test`;

  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Login User' });
  });

  it('returns 200 and sets cookies for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.join(';')).toMatch(/access_token/);
    expect(cookies.join(';')).toMatch(/refresh_token/);
  });
});

// ── Test 5: Wrong password -> 401 with same message as unknown email ─────────
describe('5. Invalid credentials error consistency', () => {
  const ip = nextIp();
  const email = `test+cred_${Date.now()}@helios.test`;

  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Cred User' });
  });

  it('returns identical 401 message for wrong password and unknown email', async () => {
    const wrongPassRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email, password: 'WrongPassword123!' })
      .expect(401);

    const unknownEmailRes = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: 'nonexistent@helios.test', password: PASS })
      .expect(401);

    expect(wrongPassRes.body.success).toBe(false);
    expect(unknownEmailRes.body.success).toBe(false);
    expect(getError(wrongPassRes).message).toBe('Invalid credentials');
    expect(getError(unknownEmailRes).message).toBe('Invalid credentials');
  });
});

// ── Test 6: GET /auth/me without cookie -> 401 ────────────────────────────────
describe('6. GET /api/v1/auth/me', () => {
  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me').expect(401);
    expect(res.body.success).toBe(false);
  });

  it('returns user info when authenticated', async () => {
    const ip = nextIp();
    const email = `test+me_${Date.now()}@helios.test`;
    const ag = request.agent(app);

    await ag
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Me User' })
      .expect(201);

    const res = await ag.get('/api/v1/auth/me').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.name).toBe('Me User');
  });
});

// ── Test 7: POST /auth/refresh rotates token; old rejected ────────────────────
describe('7. Refresh token rotation', () => {
  const ip = nextIp();
  const email = `test+ref_${Date.now()}@helios.test`;

  it('rotates refresh token and rejects reuse of old token', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Refresh User' })
      .expect(201);

    const setCookies = regRes.headers['set-cookie'] || [];
    const refreshCookieLine = setCookies.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookieLine).toBeDefined();
    const refreshCookie = refreshCookieLine.split(';')[0];

    // First rotation -> succeeds (200) and gives new refresh cookie
    const rotRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(rotRes.body.success).toBe(true);
    expect(rotRes.body.data.email).toBe(email);

    // Old refresh token must now be rejected (401)
    const oldRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);

    expect(oldRes.body.success).toBe(false);
  });
});

// ── Test 8: POST /auth/logout -> revokes token, subsequent refresh rejected ───
describe('8. POST /api/v1/auth/logout', () => {
  const ip = nextIp();
  const email = `test+logout_${Date.now()}@helios.test`;

  it('revokes refresh token and clears cookies', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Logout User' })
      .expect(201);

    const setCookies = regRes.headers['set-cookie'] || [];
    const refreshCookieLine = setCookies.find((c) => c.startsWith('refresh_token='));
    const refreshCookie = refreshCookieLine.split(';')[0];

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.data.message).toMatch(/logged out/i);

    // Attempting refresh with the logged-out token must fail (401)
    const rejRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);

    expect(rejRes.body.success).toBe(false);
  });
});

// ── Test 9: User A cannot read or delete user B's location -> 404 ─────────────
describe("9. Location ownership isolation", () => {
  const emailA = `test+owner_a_${Date.now()}@helios.test`;
  const emailB = `test+owner_b_${Date.now()}@helios.test`;
  const agentA = request.agent(app);
  const agentB = request.agent(app);

  beforeAll(async () => {
    const ipA = nextIp();
    const ipB = nextIp();
    await agentA
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ipA)
      .send({ email: emailA, password: PASS, name: 'User A' })
      .expect(201);

    await agentB
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ipB)
      .send({ email: emailB, password: PASS, name: 'User B' })
      .expect(201);
  });

  it("user A cannot read user B's location via /mine", async () => {
    // User B saves a private location
    await agentB
      .post('/api/v1/locations')
      .send({ name: "User B Secret Mountain", latitude: 35.1, longitude: 74.2 })
      .expect(201);

    // User A queries their own locations
    const resA = await agentA.get('/api/v1/locations/mine').expect(200);
    const names = (resA.body.data || []).map((l) => l.name);
    expect(names).not.toContain("User B Secret Mountain");
  });

  it("user A cannot delete user B's location (returns 404)", async () => {
    // User B saves a location
    const saveRes = await agentB
      .post('/api/v1/locations')
      .send({ name: "User B Sacred Lake", latitude: 32.5, longitude: 77.0 })
      .expect(201);
    const locId = saveRes.body.data.id;

    // User A tries to delete it -> returns 404, never 403 or 200
    await agentA.delete(`/api/v1/locations/${locId}`).expect(404);

    // Verify it still exists in B's locations
    const resB = await agentB.get('/api/v1/locations/mine').expect(200);
    const ids = (resB.body.data || []).map((l) => l.id);
    expect(ids).toContain(locId);
  });
});

// ── Test 10: Rate limit: 5 bad logins -> 429 on 6th ───────────────────────────
describe('10. Rate limiting on auth endpoints', () => {
  const rateLimitIp = `10.99.77.${Date.now() % 200}`;
  const email = `test+rate_${Date.now()}@helios.test`;

  it('allows 5 bad attempts and blocks the 6th with 429', async () => {
    // 5 failed login attempts
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', rateLimitIp)
        .send({ email, password: 'BadPassword!' })
        .expect(401);
    }

    // 6th attempt -> 429
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', rateLimitIp)
      .send({ email, password: 'BadPassword!' })
      .expect(429);

    expect(res.body.success).toBe(false);
    expect(getError(res).code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

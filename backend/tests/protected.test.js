/**
 * Protected routes + user isolation tests.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import initDB from '../src/models/init.js';

beforeAll(async () => {
  await initDB();
  await pool.query("DELETE FROM users WHERE email LIKE 'test+iso%@helios.test'");
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'test+iso%@helios.test'");
  await pool.end();
});

let ipCounter = 200;
function nextIp() { return `192.168.20.${ipCounter++}`; }

const PASS = 'Password123!';

// ── Test 11: Protected routes return 401 without auth ─────────────────────────
describe('11. Protected routes — 401 without auth cookie', () => {
  it('GET /api/health is public', async () => {
    await request(app)
      .get('/api/health')
      .expect(200);
  });

  it('POST /api/v1/auth/register is public (not 401)', async () => {
    const ip = nextIp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({});
    expect(res.status).not.toBe(401);
  });

  it('POST /api/v1/auth/login is public (not 401 from access control)', async () => {
    const ip = nextIp();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: 'nobody@helios.test', password: 'wrongpass' });
    // Expect 401 because credentials are wrong, not because the route is blocked
    // The route itself must be reachable (not 404 or 403)
    expect([401, 400]).toContain(res.status);
  });

  it('POST /api/v1/auth/refresh is reachable (not 404)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).not.toBe(404);
  });

  const protectedRoutes = [
    ['GET',  '/api/v1/locations/search?q=London'],
    ['GET',  '/api/v1/locations/mine'],
    ['GET',  '/api/v1/locations'],
    ['POST', '/api/v1/locations'],
    ['GET',  '/api/v1/solar/day?lat=51.5&lon=-0.1&date=2024-06-21&time=12:00'],
    ['GET',  '/api/v1/earth/imagery'],
    ['POST', '/api/v1/analysis'],
    ['GET',  '/api/v1/dem/tile/12/3251/1570.png'],
  ];

  for (const [method, path] of protectedRoutes) {
    it(`${method} ${path} → 401 without cookie`, async () => {
      const req = request(app)[method.toLowerCase()](path);
      if (method === 'POST') req.send({});
      await req.expect(401);
    });
  }
});

// ── Test 12: User isolation ────────────────────────────────────────────────────
describe('12. User isolation', () => {
  async function registerAgent(email, ip) {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email, password: PASS, name: 'Iso User' })
      .expect(201);
    return agent;
  }

  it('user C cannot see or delete locations saved by user D', async () => {
    const emailC = `test+isoC_${Date.now()}@helios.test`;
    const emailD = `test+isoD_${Date.now()}@helios.test`;

    const agentC = await registerAgent(emailC, nextIp());
    const agentD = await registerAgent(emailD, nextIp());

    // D saves a location
    const saveRes = await agentD
      .post('/api/v1/locations')
      .send({ name: 'User D Place', latitude: 48.8566, longitude: 2.3522 })
      .expect(201);
    const locId = saveRes.body.data.id;

    // C lists locations — must NOT see D's
    const listRes = await agentC.get('/api/v1/locations').expect(200);
    const ids = (listRes.body.data || []).map((l) => l.id);
    expect(ids).not.toContain(locId);

    // C tries to delete D's location — 404
    await agentC.delete(`/api/v1/locations/${locId}`).expect(404);

    // D's location still exists
    const dList = await agentD.get('/api/v1/locations/mine').expect(200);
    expect(dList.body.data.map((l) => l.id)).toContain(locId);
  });
});

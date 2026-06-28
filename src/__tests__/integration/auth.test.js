/**
 * @module AUTH Integration Tests
 * @description Production-ready test suite for /api/auth endpoints (login & logout).
 *
 * Coverage:
 *  - POST /api/auth/login  → 200, 400, 401
 *  - POST /api/auth/logout → 200, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, generateToken, createMockAuthUser } = require('../helpers/auth.helper');

describe('AUTH - /api/auth', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/auth/login
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/auth/login', () => {
    // ── Positive Cases ────────────────────────────────────────────
    it('should return 200 and JWT token with valid credentials', async () => {
      await prisma.user.create({
        data: {
          name: 'Admin Test',
          email: 'admin@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.local', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token');
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.token.length).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('email', 'admin@test.local');
      expect(res.body.data.user).toHaveProperty('name', 'Admin Test');
      expect(res.body.data.user).toHaveProperty('role', 'ADMIN');
    });

    it('should not expose passwordHash in login response', async () => {
      await prisma.user.create({
        data: {
          name: 'Guru Test',
          email: 'guru@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'GURU',
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'guru@test.local', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    // ── Negative Cases ────────────────────────────────────────────
    it('should return 401 when password is incorrect', async () => {
      await prisma.user.create({
        data: {
          name: 'Admin Test',
          email: 'admin@test.local',
          passwordHash: await hashPassword('correctPassword'),
          role: 'ADMIN',
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.local', password: 'wrongPassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Email atau password tidak valid');
    });

    it('should return 401 when email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.local', password: 'anypassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Email atau password tidak valid');
    });

    it('should return 400 when email and password are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when email is empty string', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when password is too short (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.local', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/auth/logout
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/auth/logout', () => {
    // ── Positive Cases ────────────────────────────────────────────
    it('should return 200 on successful logout with valid token', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Logout Test',
          email: 'logout@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });
      const { token } = createMockAuthUser({ id: user.id });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });

    // ── Negative Cases ────────────────────────────────────────────
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when token is malformed', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when token belongs to non-existent user', async () => {
      const token = generateToken(99999, 'ADMIN');

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});

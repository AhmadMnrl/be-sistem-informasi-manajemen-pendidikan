/**
 * @module LOGS Integration Tests
 * @description Production-ready test suite for /api/logs endpoints.
 *
 * Coverage:
 *  - GET /api/logs → 200 (ADMIN), 403 (GURU), 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('ACTIVITY LOGS - /api/logs', () => {
  let adminAuth, guruAuth, adminUser, guruUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    guruUser = await prisma.user.create({
      data: {
        name: 'Guru Test',
        email: 'guru@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    adminAuth = createMockAuthUser({ id: adminUser.id, role: 'ADMIN' });
    guruAuth = createMockAuthUser({ id: guruUser.id, role: 'GURU' });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/logs
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/logs', () => {
    it('should return 200 and list activity logs for ADMIN', async () => {
      // Create some activity logs in database
      await prisma.activityLog.create({
        data: {
          action: 'LOGIN',
          entity: 'User',
          entityId: adminUser.id,
          userId: adminUser.id,
        },
      });

      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 when GURU tries to list activity logs', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/logs');
      expect(res.statusCode).toBe(401);
    });
  });
});

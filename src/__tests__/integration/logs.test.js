/**
 * @module LOGS Integration Tests
 * @description Integration tests aligned with the Postman collection.
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('ACTIVITY LOGS - /api/logs', () => {
  let adminAuth;
  let kepsekAuth;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    const kepsekUser = await prisma.user.create({
      data: {
        name: 'Kepsek Test',
        email: 'kepsek@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'KEPALA_SEKOLAH',
      },
    });

    adminAuth = createMockAuthUser({ id: adminUser.id, role: 'ADMIN' });
    kepsekAuth = createMockAuthUser({ id: kepsekUser.id, role: 'KEPALA_SEKOLAH' });

    await prisma.activityLog.create({
      data: {
        action: 'LOGIN',
        entity: 'User',
        entityId: adminUser.id,
        userId: adminUser.id,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/logs', () => {
    it('61 - Mendapatkan Log Aktivitas Sistem', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('62 - Mendapatkan Log Aktivitas Gagal - Diakses Kepala Sekolah', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${kepsekAuth.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});

/**
 * @module SUMMARY Integration Tests
 * @description Production-ready test suite for /api/summary endpoints.
 *
 * Coverage:
 *  - GET /api/summary → 200, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('SUMMARY - /api/summary', () => {
  let authUser, user;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    user = await prisma.user.create({
      data: {
        name: 'Teacher User',
        email: 'teacher@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    authUser = createMockAuthUser({ id: user.id, role: user.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/summary
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/summary', () => {
    it('should return 200 and dashboard statistics summary', async () => {
      // Seed some database records to check count accuracy
      await prisma.student.create({
        data: { name: 'Siswa Test', identifier: 'STU-101' },
      });

      await prisma.document.create({
        data: {
          title: 'Surat Keputusan',
          filePath: '/uploads/documents/sk.pdf',
          uploadedById: user.id,
        },
      });

      const res = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      
      const stats = res.body.data;
      expect(stats).toHaveProperty('studentsCount');
      expect(stats).toHaveProperty('reportsCount');
      expect(stats).toHaveProperty('documentsCount');
      expect(stats).toHaveProperty('anecdotesCountTotal');
      expect(stats).toHaveProperty('guruCount');
      expect(stats).toHaveProperty('latestAnecdotes');
      expect(Array.isArray(stats.latestAnecdotes)).toBe(true);

      expect(stats.studentsCount).toBe(1);
      expect(stats.documentsCount).toBe(1);
      expect(stats.guruCount).toBe(1); // the teacher we created
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/summary');
      expect(res.statusCode).toBe(401);
    });
  });
});

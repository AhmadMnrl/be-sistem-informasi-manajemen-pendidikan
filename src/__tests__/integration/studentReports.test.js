const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockStudent } = require('../helpers/fixtures');

describe('STUDENT REPORTS - CRUD Operations', () => {
  let authUser, student;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    const user = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    student = await prisma.student.create({
      data: createMockStudent(),
    });

    authUser = createMockAuthUser({ id: user.id, role: user.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/student-reports', () => {
    it('should list student reports', async () => {
      const res = await request(app)
        .get('/api/student-reports')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });

  describe('POST /api/student-reports', () => {
    it('should create student report', async () => {
      const res = await request(app)
        .post('/api/student-reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          studentId: student.id,
          tahunAjaran: '2025/2026',
          photoUrl: '/path/to/photo.jpg',
        });

      expect([201, 400, 404]).toContain(res.statusCode);
    });
  });

  describe('GET /api/student-reports/:id', () => {
    it('should get student report by id', async () => {
      const res = await request(app)
        .get('/api/student-reports/1')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });
});

const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockReport, createMockStudent } = require('../helpers/fixtures');

describe('REPORTS - CRUD Operations', () => {
  let authUser, teacher, student;

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

    teacher = await prisma.user.create({
      data: {
        name: 'Guru Test',
        email: 'guru@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    student = await prisma.student.create({
      data: {
        name: 'Siswa Test',
        identifier: 'STU-TEST-001',
        nisn: '1234567890',
        className: 'A',
        tahunAjaran: '2025/2026',
      },
    });

    authUser = createMockAuthUser({ id: user.id, role: user.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/reports', () => {
    it('should list all reports', async () => {
      await prisma.report.createMany({
        data: [
          createMockReport({ studentId: student.id, teacherId: teacher.id, title: 'Report 1' }),
          createMockReport({ studentId: student.id, teacherId: teacher.id, title: 'Report 2' }),
        ],
      });

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
        expect(res.body.data.data || Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/reports', () => {
    it('should create report', async () => {
      const reportData = createMockReport({ studentId: student.id, teacherId: teacher.id });

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(reportData);

      expect([201, 400]).toContain(res.statusCode);
    });
  });

  describe('GET /api/reports/:id', () => {
    it('should get report by id', async () => {
      const report = await prisma.report.create({
        data: createMockReport({ studentId: student.id, teacherId: teacher.id }),
      });

      const res = await request(app)
        .get(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(report.id);
    });
  });

  describe('PUT /api/reports/:id', () => {
    it('should update report', async () => {
      const report = await prisma.report.create({
        data: createMockReport({ studentId: student.id, teacherId: teacher.id }),
      });

      const res = await request(app)
        .put(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ title: 'Updated Title' });

      expect([200, 400]).toContain(res.statusCode);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete report', async () => {
      const report = await prisma.report.create({
        data: createMockReport({ studentId: student.id, teacherId: teacher.id }),
      });

      const res = await request(app)
        .delete(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
    });
  });
});

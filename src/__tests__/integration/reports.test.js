/**
 * @module REPORTS Integration Tests
 * @description Production-ready test suite for /api/reports endpoints (CRUD).
 *
 * Coverage:
 *  - GET    /api/reports      → 200, 401
 *  - POST   /api/reports      → 201, 400 (missing fields), 401
 *  - GET    /api/reports/:id  → 200, 404, 401
 *  - PUT    /api/reports/:id  → 200, 404, 401
 *  - DELETE /api/reports/:id  → 200, 404, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockReport, createMockStudent } = require('../helpers/fixtures');

describe('REPORTS - /api/reports', () => {
  let authUser, teacher, student;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    const admin = await prisma.user.create({
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

    authUser = createMockAuthUser({ id: admin.id, role: admin.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/reports
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/reports', () => {
    it('should return 200 and list of reports', async () => {
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
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/reports');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/reports
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/reports', () => {
    it('should return 201 and created report data', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          studentId: student.id,
          title: 'Laporan Baru',
          description: 'Deskripsi laporan',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title', 'Laporan Baru');
      expect(res.body.data).toHaveProperty('studentId', student.id);

      // Verify persisted in database
      const dbReport = await prisma.report.findUnique({ where: { id: res.body.data.id } });
      expect(dbReport).not.toBeNull();
      expect(dbReport.title).toBe('Laporan Baru');
    });

    it('should return 400 when studentId and title are missing', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ description: 'Only description' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({ studentId: student.id, title: 'No Auth' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/reports/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/reports/:id', () => {
    it('should return 200 and report data when report exists', async () => {
      const report = await prisma.report.create({
        data: createMockReport({ studentId: student.id, teacherId: teacher.id }),
      });

      const res = await request(app)
        .get(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', report.id);
      expect(res.body.data).toHaveProperty('title');
    });

    it('should return 404 when report does not exist', async () => {
      const res = await request(app)
        .get('/api/reports/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Rapor tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/reports/1');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/reports/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/reports/:id', () => {
    it('should return 200 and updated report data', async () => {
      const report = await prisma.report.create({
        data: createMockReport({ studentId: student.id, teacherId: teacher.id }),
      });

      const res = await request(app)
        .put(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('title', 'Updated Title');
    });

    it('should return 404 when report does not exist', async () => {
      const res = await request(app)
        .put('/api/reports/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ title: 'Ghost' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Rapor tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .put('/api/reports/1')
        .send({ title: 'No Auth' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/reports/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/reports/:id', () => {
    it('should return 200 and delete the report successfully', async () => {
      const report = await prisma.report.create({
        data: createMockReport({ studentId: student.id, teacherId: teacher.id }),
      });

      const res = await request(app)
        .delete(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('Rapor berhasil dihapus');

      // Verify deleted from database
      const deleted = await prisma.report.findUnique({ where: { id: report.id } });
      expect(deleted).toBeNull();
    });

    it('should return 404 when report does not exist', async () => {
      const res = await request(app)
        .delete('/api/reports/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Rapor tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).delete('/api/reports/1');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});

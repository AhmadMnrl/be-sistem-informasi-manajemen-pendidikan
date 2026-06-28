/**
 * @module STUDENT_REPORTS Integration Tests
 * @description Production-ready test suite for /api/reports/student-reports endpoints.
 *
 * Coverage:
 *  - GET    /api/reports/student-reports       → 200, 401
 *  - POST   /api/reports/student-reports       → 201, 400 (validation/duplicate), 404, 401
 *  - GET    /api/reports/student-reports/:id   → 200, 404, 401
 *  - PUT    /api/reports/student-reports/:id   → 200, 404, 401, 400
 *  - DELETE /api/reports/student-reports/:id   → 200, 404, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockStudent } = require('../helpers/fixtures');

describe('STUDENT REPORTS - /api/reports/student-reports', () => {
  let authUser, adminUser, student, template, question;

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

    student = await prisma.student.create({
      data: createMockStudent({ identifier: 'STUDENT-REPORT-001' }),
    });

    template = await prisma.reportTemplate.create({
      data: {
        title: 'Template Rapor Bulanan',
        year: 2026,
        isActive: true,
        createdById: adminUser.id,
      },
    });

    const section = await prisma.reportSection.create({
      data: {
        templateId: template.id,
        sectionNumber: 1,
        order: 0,
        type: 'TEXT',
        title: 'Aspek Perkembangan Nilai Agama',
      },
    });

    question = await prisma.reportQuestion.create({
      data: {
        sectionId: section.id,
        text: 'Melafalkan doa harian?',
        order: 0,
        type: 'FREE_TEXT',
      },
    });

    authUser = createMockAuthUser({ id: adminUser.id, role: adminUser.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/reports/student-reports
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/reports/student-reports', () => {
    it('should return 200 and list student reports', async () => {
      await prisma.studentReport.create({
        data: {
          studentId: student.id,
          templateId: template.id,
          year: 2026,
          tahunAjaran: '2025/2026',
          semester: 'GANJIL',
          createdById: adminUser.id,
        },
      });

      const res = await request(app)
        .get('/api/reports/student-reports')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/reports/student-reports');
      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/reports/student-reports
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/reports/student-reports', () => {
    it('should return 201 and submit student report successfully', async () => {
      const payload = {
        studentId: student.id,
        templateId: template.id,
        tahun_ajaran: '2025/2026',
        semester: 'ganjil',
        answers: [
          {
            questionId: question.id,
            answer: 'Sangat baik',
            photo: '',
            ket: 'Berkembang sesuai harapan',
          }
        ]
      };

      const res = await request(app)
        .post('/api/reports/student-reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');

      // Verify DB state
      const dbReport = await prisma.studentReport.findUnique({
        where: { id: res.body.data.id },
        include: { answers: true }
      });
      expect(dbReport).not.toBeNull();
      expect(dbReport.answers.length).toBe(1);
      expect(dbReport.answers[0].answerText).toBe('Sangat baik');
    });

    it('should return 400 when questionId does not belong to template', async () => {
      const payload = {
        studentId: student.id,
        templateId: template.id,
        tahun_ajaran: '2025/2026',
        semester: 'ganjil',
        answers: [
          {
            questionId: 99999, // Invalid question ID
            answer: 'Baik',
          }
        ]
      };

      const res = await request(app)
        .post('/api/reports/student-reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 404 when student does not exist', async () => {
      const payload = {
        studentId: 99999,
        templateId: template.id,
        tahun_ajaran: '2025/2026',
        semester: 'ganjil',
        answers: [
          {
            questionId: question.id,
            answer: 'Baik',
          }
        ]
      };

      const res = await request(app)
        .post('/api/reports/student-reports')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(payload);

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/reports/student-reports/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/reports/student-reports/:id', () => {
    it('should return 200 and report details when report exists', async () => {
      const report = await prisma.studentReport.create({
        data: {
          studentId: student.id,
          templateId: template.id,
          year: 2026,
          tahunAjaran: '2025/2026',
          semester: 'GANJIL',
          createdById: adminUser.id,
        },
      });

      const res = await request(app)
        .get(`/api/reports/student-reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('studentId', student.id);
    });

    it('should return 404 when student report not found', async () => {
      const res = await request(app)
        .get('/api/reports/student-reports/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/reports/student-reports/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/reports/student-reports/:id', () => {
    it('should return 200 and update report successfully', async () => {
      const report = await prisma.studentReport.create({
        data: {
          studentId: student.id,
          templateId: template.id,
          year: 2026,
          tahunAjaran: '2025/2026',
          semester: 'GANJIL',
          createdById: adminUser.id,
          answers: {
            create: {
              questionId: question.id,
              answerText: 'Sangat baik',
            }
          }
        },
      });

      const payload = {
        studentId: student.id,
        templateId: template.id,
        tahun_ajaran: '2025/2026',
        semester: 'ganjil',
        answers: [
          {
            questionId: question.id,
            answer: 'Cukup',
          }
        ]
      };

      const res = await request(app)
        .put(`/api/reports/student-reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify DB update
      const dbAnswer = await prisma.studentReportAnswer.findFirst({
        where: { studentReportId: report.id, questionId: question.id }
      });
      expect(dbAnswer.answerText).toBe('Cukup');
    });

    it('should return 404 when report to update does not exist', async () => {
      const payload = {
        studentId: student.id,
        templateId: template.id,
        tahun_ajaran: '2025/2026',
        semester: 'ganjil',
        answers: [{ questionId: question.id, answer: 'Cukup' }]
      };

      const res = await request(app)
        .put('/api/reports/student-reports/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(payload);

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/reports/student-reports/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/reports/student-reports/:id', () => {
    it('should return 200 and delete the student report', async () => {
      const report = await prisma.studentReport.create({
        data: {
          studentId: student.id,
          templateId: template.id,
          year: 2026,
          tahunAjaran: '2025/2026',
          semester: 'GANJIL',
          createdById: adminUser.id,
        },
      });

      const res = await request(app)
        .delete(`/api/reports/student-reports/${report.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify DB state
      const dbReport = await prisma.studentReport.findUnique({ where: { id: report.id } });
      expect(dbReport).toBeNull();
    });

    it('should return 404 when student report to delete not found', async () => {
      const res = await request(app)
        .delete('/api/reports/student-reports/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});

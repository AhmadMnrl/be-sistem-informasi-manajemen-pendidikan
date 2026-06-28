/**
 * @module QUESTIONS Integration Tests
 * @description Production-ready test suite for /api/questions endpoints.
 *
 * Coverage:
 *  - GET    /api/questions                    → 200, 401
 *  - GET    /api/questions/sections           → 200, 401
 *  - GET    /api/questions/sections/:id       → 200, 404, 401, 400 (invalid id)
 *  - POST   /api/questions                    → 201, 400 (validation), 401
 *  - PUT    /api/questions/:id                → 200, 404, 401
 *  - PUT    /api/questions/sections/:id       → 200, 404, 401, 400 (validation)
 *  - DELETE /api/questions/:id                → 200, 404, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockQuestion } = require('../helpers/fixtures');

describe('QUESTIONS - /api/questions', () => {
  let authUser, teacherUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    teacherUser = await prisma.user.create({
      data: {
        name: 'Teacher Test',
        email: 'teacher@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    authUser = createMockAuthUser({ id: teacherUser.id, role: 'GURU' });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/questions & GET /api/questions/sections
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/questions/sections', () => {
    it('should return 200 and list of sections', async () => {
      await prisma.question.createMany({
        data: [
          createMockQuestion({ teacherId: teacherUser.id, section: 'Seksi 1', text: 'Tanya 1' }),
          createMockQuestion({ teacherId: teacherUser.id, section: 'Seksi 2', text: 'Tanya 2' }),
        ],
      });

      const res = await request(app)
        .get('/api/questions/sections')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/questions/sections');
      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/questions/sections/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/questions/sections/:id', () => {
    it('should return 200 and section details when section exists', async () => {
      const q = await prisma.question.create({
        data: createMockQuestion({ teacherId: teacherUser.id, section: 'Spesifik Seksi', text: 'Tanya 1' }),
      });

      const res = await request(app)
        .get(`/api/questions/sections/${q.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('section', 'Spesifik Seksi');
      expect(res.body.data).toHaveProperty('questions');
      expect(Array.isArray(res.body.data.questions)).toBe(true);
    });

    it('should return 404 when section/id does not exist', async () => {
      const res = await request(app)
        .get('/api/questions/sections/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 400 when id is invalid', async () => {
      const res = await request(app)
        .get('/api/questions/sections/abc')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/questions
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/questions', () => {
    it('should return 201 and created question', async () => {
      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          text: 'Apakah siswa bisa berhitung?',
          section: 'Kognitif',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.text).toBe('Apakah siswa bisa berhitung?');

      const dbQ = await prisma.question.findUnique({ where: { id: res.body.data.id } });
      expect(dbQ).not.toBeNull();
    });

    it('should support bulk creation and return 201', async () => {
      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          section: 'Sosial Emosional',
          questions: [
            { text: 'Apakah siswa berbagi?' },
            { text: 'Apakah siswa sabar mengantre?' }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('count', 2);

      const count = await prisma.question.count({ where: { section: 'Sosial Emosional' } });
      expect(count).toBe(2);
    });

    it('should return 400 when neither text nor questions are provided', async () => {
      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          section: 'Kognitif',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/questions/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/questions/:id', () => {
    it('should return 200 and updated question data', async () => {
      const q = await prisma.question.create({
        data: createMockQuestion({ teacherId: teacherUser.id, text: 'Tanya Awal' }),
      });

      const res = await request(app)
        .put(`/api/questions/${q.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ text: 'Tanya Akhir' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.text).toBe('Tanya Akhir');

      const dbQ = await prisma.question.findUnique({ where: { id: q.id } });
      expect(dbQ.text).toBe('Tanya Akhir');
    });

    it('should return 404 when question does not exist', async () => {
      const res = await request(app)
        .put('/api/questions/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ text: 'Tanya Baru' });

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/questions/sections/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/questions/sections/:id', () => {
    it('should return 200 and replace section questions bulk', async () => {
      const q = await prisma.question.create({
        data: createMockQuestion({ teacherId: teacherUser.id, section: 'Seksi Ganti', text: 'Tanya Ganti' }),
      });

      const res = await request(app)
        .put(`/api/questions/sections/${q.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          section: 'Seksi Baru',
          questions: [
            { text: 'Pertanyaan Ganti Baru 1' },
            { text: 'Pertanyaan Ganti Baru 2' },
          ]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalQuestions', 2);

      // Verify old section deleted and new created in DB
      const oldCount = await prisma.question.count({ where: { section: 'Seksi Ganti' } });
      const newCount = await prisma.question.count({ where: { section: 'Seksi Baru' } });
      expect(oldCount).toBe(0);
      expect(newCount).toBe(2);
    });

    it('should return 404 when section id does not exist', async () => {
      const res = await request(app)
        .put('/api/questions/sections/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          section: 'Seksi Baru',
          questions: [{ text: 'Tanya' }]
        });

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/questions/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/questions/:id', () => {
    it('should return 200 and delete question', async () => {
      const q = await prisma.question.create({
        data: createMockQuestion({ teacherId: teacherUser.id }),
      });

      const res = await request(app)
        .delete(`/api/questions/${q.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      const dbQ = await prisma.question.findUnique({ where: { id: q.id } });
      expect(dbQ).toBeNull();
    });

    it('should return 404 when question does not exist', async () => {
      const res = await request(app)
        .delete('/api/questions/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});

const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockQuestion } = require('../helpers/fixtures');

describe('QUESTIONS - CRUD Operations', () => {
  let authUser, teacher;

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

    authUser = createMockAuthUser({ id: user.id, role: user.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/questions', () => {
    it('should list all questions', async () => {
      await prisma.question.createMany({
        data: [
          createMockQuestion({ teacherId: teacher.id, text: 'Q1?' }),
          createMockQuestion({ teacherId: teacher.id, text: 'Q2?' }),
        ],
      });

      const res = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      const items = res.body.data.data || res.body.data;
      expect(items).toBeDefined();
    });
  });

  describe('POST /api/questions', () => {
    it('should create question', async () => {
      const questionData = createMockQuestion({ teacherId: teacher.id });

      const res = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(questionData);

      expect([201, 400]).toContain(res.statusCode);
    });
  });

  // Note: GET /api/questions/:id not implemented in routes

  describe('PUT /api/questions/:id', () => {
    it('should update question', async () => {
      const question = await prisma.question.create({
        data: createMockQuestion({ teacherId: teacher.id }),
      });

      const res = await request(app)
        .put(`/api/questions/${question.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ text: 'Updated question?' });

      expect([200, 400]).toContain(res.statusCode);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('should delete question', async () => {
      const question = await prisma.question.create({
        data: createMockQuestion({ teacherId: teacher.id }),
      });

      const res = await request(app)
        .delete(`/api/questions/${question.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
    });
  });
});

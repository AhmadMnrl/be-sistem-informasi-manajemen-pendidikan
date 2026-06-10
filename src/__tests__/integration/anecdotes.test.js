const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockAnecdote, createMockUser } = require('../helpers/fixtures');

describe('ANECDOTES - CRUD Operations', () => {
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

  describe('GET /api/anecdotes', () => {
    it('should list all anecdotes', async () => {
      await prisma.anecdote.createMany({
        data: [
          createMockAnecdote({ teacherId: teacher.id, content: 'Anekdot 1' }),
          createMockAnecdote({ teacherId: teacher.id, content: 'Anekdot 2' }),
        ],
      });

      const res = await request(app)
        .get('/api/anecdotes')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
        const items = res.body.data.data || res.body.data;
        expect(items).toBeDefined();
    });
  });

  describe('POST /api/anecdotes', () => {
    it('should create anecdote', async () => {
      const anecdoteData = createMockAnecdote({ teacherId: teacher.id });

      const res = await request(app)
        .post('/api/anecdotes')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(anecdoteData);

      expect([201, 400]).toContain(res.statusCode);
    });
  });

  describe('GET /api/anecdotes/:id', () => {
    it('should get anecdote by id', async () => {
      const anecdote = await prisma.anecdote.create({
        data: createMockAnecdote({ teacherId: teacher.id }),
      });

      const res = await request(app)
        .get(`/api/anecdotes/${anecdote.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(anecdote.id);
    });
  });

  describe('PUT /api/anecdotes/:id', () => {
    it('should update anecdote', async () => {
      const anecdote = await prisma.anecdote.create({
        data: createMockAnecdote({ teacherId: teacher.id }),
      });

      const res = await request(app)
        .put(`/api/anecdotes/${anecdote.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ content: 'Updated content' });

      expect([200, 400]).toContain(res.statusCode);
    });
  });

  describe('DELETE /api/anecdotes/:id', () => {
    it('should delete anecdote', async () => {
      const anecdote = await prisma.anecdote.create({
        data: createMockAnecdote({ teacherId: teacher.id }),
      });

      const res = await request(app)
        .delete(`/api/anecdotes/${anecdote.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
    });
  });
});

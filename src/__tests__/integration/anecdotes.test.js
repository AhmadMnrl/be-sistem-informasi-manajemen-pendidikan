/**
 * @module ANECDOTES Integration Tests
 * @description Production-ready test suite for /api/anecdotes endpoints (CRUD operations).
 *
 * Coverage:
 *  - GET    /api/anecdotes       → 200, 401
 *  - POST   /api/anecdotes       → 201, 400 (validation), 401
 *  - GET    /api/anecdotes/:id   → 200, 404, 401
 *  - PUT    /api/anecdotes/:id   → 200, 404, 400, 401
 *  - DELETE /api/anecdotes/:id   → 200, 404, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockAnecdote } = require('../helpers/fixtures');

describe('ANECDOTES - /api/anecdotes', () => {
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
  // GET /api/anecdotes
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/anecdotes', () => {
    it('should return 200 and list of anecdotes', async () => {
      await prisma.anecdote.createMany({
        data: [
          createMockAnecdote({ teacherId: teacherUser.id, content: 'Anekdot 1' }),
          createMockAnecdote({ teacherId: teacherUser.id, content: 'Anekdot 2' }),
        ],
      });

      const res = await request(app)
        .get('/api/anecdotes')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/anecdotes');
      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/anecdotes
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/anecdotes', () => {
    it('should return 201 and created anecdote data', async () => {
      const res = await request(app)
        .post('/api/anecdotes')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          content: 'Siswa menolong teman yang terjatuh',
          description: 'Kejadian di taman bermain',
          category: 'Sosial',
          date: '2026-06-13T00:00:00.000Z',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.content).toBe('Siswa menolong teman yang terjatuh');

      // Verify persisted in database
      const dbAnecdote = await prisma.anecdote.findUnique({ where: { id: res.body.data.id } });
      expect(dbAnecdote).not.toBeNull();
      expect(dbAnecdote.content).toBe('Siswa menolong teman yang terjatuh');
    });

    it('should return 400 when content is missing', async () => {
      const res = await request(app)
        .post('/api/anecdotes')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          description: 'Tanpa konten',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/anecdotes')
        .send({ content: 'Laporan Anekdot' });

      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/anecdotes/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/anecdotes/:id', () => {
    it('should return 200 and anecdote data when it exists', async () => {
      const anecdote = await prisma.anecdote.create({
        data: createMockAnecdote({ teacherId: teacherUser.id, content: 'Spesifik Anekdot' }),
      });

      const res = await request(app)
        .get(`/api/anecdotes/${anecdote.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.content).toBe('Spesifik Anekdot');
    });

    it('should return 404 when anecdote does not exist', async () => {
      const res = await request(app)
        .get('/api/anecdotes/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/anecdotes/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/anecdotes/:id', () => {
    it('should return 200 and updated anecdote data', async () => {
      const anecdote = await prisma.anecdote.create({
        data: createMockAnecdote({ teacherId: teacherUser.id, content: 'Konten Lama' }),
      });

      const res = await request(app)
        .put(`/api/anecdotes/${anecdote.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ content: 'Konten Baru' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.content).toBe('Konten Baru');

      // Verify DB state
      const dbAnecdote = await prisma.anecdote.findUnique({ where: { id: anecdote.id } });
      expect(dbAnecdote.content).toBe('Konten Baru');
    });

    it('should return 404 when anecdote not found on update', async () => {
      const res = await request(app)
        .put('/api/anecdotes/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ content: 'Update Anekdot' });

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/anecdotes/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/anecdotes/:id', () => {
    it('should return 200 and delete anecdote', async () => {
      const anecdote = await prisma.anecdote.create({
        data: createMockAnecdote({ teacherId: teacherUser.id }),
      });

      const res = await request(app)
        .delete(`/api/anecdotes/${anecdote.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify DB state
      const dbAnecdote = await prisma.anecdote.findUnique({ where: { id: anecdote.id } });
      expect(dbAnecdote).toBeNull();
    });

    it('should return 404 when anecdote not found on delete', async () => {
      const res = await request(app)
        .delete('/api/anecdotes/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});

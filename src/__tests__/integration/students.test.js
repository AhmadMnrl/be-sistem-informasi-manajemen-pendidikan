/**
 * @module STUDENTS Integration Tests
 * @description Production-ready test suite for /api/students endpoints (CRUD + options).
 *
 * Coverage:
 *  - GET    /api/students          → 200, 401 (pagination)
 *  - POST   /api/students          → 201, 400 (missing fields), 401
 *  - GET    /api/students/:id      → 200, 404, 401
 *  - PUT    /api/students/:id      → 200, 404, 401
 *  - DELETE /api/students/:id      → 200, 404, 401
 *  - GET    /api/students/options   → 200, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockStudent } = require('../helpers/fixtures');

describe('STUDENTS - /api/students', () => {
  let authUser;

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

    authUser = createMockAuthUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/students
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/students', () => {
    it('should return 200 and paginated student list', async () => {
      await prisma.student.createMany({
        data: [
          createMockStudent({ name: 'Student 1' }),
          createMockStudent({ name: 'Student 2', identifier: 'STU-TEST-002' }),
        ],
      });

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBe(2);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/students');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should support pagination with proper structure', async () => {
      const students = Array.from({ length: 15 }, (_, i) =>
        createMockStudent({ name: `Student ${i + 1}`, identifier: `STU-${i}` })
      );
      await prisma.student.createMany({ data: students });

      const res = await request(app)
        .get('/api/students?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(10);
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/students
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/students', () => {
    it('should return 201 and created student data', async () => {
      const newStudent = createMockStudent();

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(newStudent);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', newStudent.name);
      expect(res.body.data).toHaveProperty('identifier', newStudent.identifier);

      // Verify persisted in database
      const dbStudent = await prisma.student.findUnique({ where: { id: res.body.data.id } });
      expect(dbStudent).not.toBeNull();
      expect(dbStudent.name).toBe(newStudent.name);
    });

    it('should return 400 when required field identifier is missing', async () => {
      const invalidStudent = createMockStudent();
      delete invalidStudent.identifier;

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(invalidStudent);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ identifier: 'STU-001' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/students')
        .send(createMockStudent());

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/students/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/students/:id', () => {
    it('should return 200 and student data when student exists', async () => {
      const student = await prisma.student.create({
        data: createMockStudent(),
      });

      const res = await request(app)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', student.id);
      expect(res.body.data).toHaveProperty('name', student.name);
    });

    it('should return 404 when student does not exist', async () => {
      const res = await request(app)
        .get('/api/students/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Siswa tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/students/1');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/students/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/students/:id', () => {
    it('should return 200 and updated student data', async () => {
      const student = await prisma.student.create({
        data: createMockStudent(),
      });

      const res = await request(app)
        .put(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ name: 'Updated Student Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'Updated Student Name');

      // Verify persisted in database
      const dbStudent = await prisma.student.findUnique({ where: { id: student.id } });
      expect(dbStudent.name).toBe('Updated Student Name');
    });

    it('should return 404 when student does not exist', async () => {
      const res = await request(app)
        .put('/api/students/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ name: 'Ghost' });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Siswa tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .put('/api/students/1')
        .send({ name: 'No Auth' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/students/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/students/:id', () => {
    it('should return 200 and delete the student successfully', async () => {
      const student = await prisma.student.create({
        data: createMockStudent(),
      });

      const res = await request(app)
        .delete(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('Siswa berhasil dihapus');

      // Verify deleted from database
      const deleted = await prisma.student.findUnique({ where: { id: student.id } });
      expect(deleted).toBeNull();
    });

    it('should return 404 when student does not exist', async () => {
      const res = await request(app)
        .delete('/api/students/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Siswa tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).delete('/api/students/1');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/students/options
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/students/options', () => {
    it('should return 200 and student options with label/value', async () => {
      await prisma.student.create({ data: createMockStudent() });

      const res = await request(app)
        .get('/api/students/options')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('label');
      expect(res.body.data[0]).toHaveProperty('value');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/students/options');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});

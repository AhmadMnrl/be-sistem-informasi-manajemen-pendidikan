const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockStudent, createMockUser } = require('../helpers/fixtures');

describe('STUDENTS - CRUD Operations', () => {
  let authUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    // Create auth user
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

  describe('GET /api/students', () => {
    it('should list all students with auth', async () => {
      // Setup: Create test students
      await prisma.student.createMany({
        data: [
          createMockStudent({ name: 'Student 1' }),
          createMockStudent({ name: 'Student 2', identifier: 'STU-TEST-002' }),
        ],
      });

      // Act
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBe(2);
    });

    it('should fail without auth token', async () => {
      const res = await request(app).get('/api/students');

      expect(res.statusCode).toBe(401);
    });

    it('should support pagination with proper structure', async () => {
      // Create 15 students
      const students = Array.from({ length: 15 }, (_, i) =>
        createMockStudent({ name: `Student ${i + 1}`, identifier: `STU-${i}` })
      );
      await prisma.student.createMany({ data: students });

      // Act: Get first page
      const res = await request(app)
        .get('/api/students?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authUser.token}`);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(10);
      expect(res.body.data.pagination).toBeDefined();
    });

  describe('POST /api/students', () => {
    it('should create a new student', async () => {
      const newStudent = createMockStudent();

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(newStudent);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newStudent.name);
      expect(res.body.data.identifier).toBe(newStudent.identifier);
    });

    it('should fail with missing required field', async () => {
      const invalidStudent = createMockStudent();
      delete invalidStudent.identifier;

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(invalidStudent);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/students/:id', () => {
    it('should get student by id', async () => {
      const student = await prisma.student.create({
        data: createMockStudent(),
      });

      const res = await request(app)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(student.id);
      expect(res.body.data.name).toBe(student.name);
    });

    it('should return 404 for non-existent student', async () => {
      const res = await request(app)
        .get('/api/students/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('should update student successfully', async () => {
      const student = await prisma.student.create({
        data: createMockStudent(),
      });

      const updateData = { name: 'Updated Student Name' };

      const res = await request(app)
        .put(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated Student Name');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should delete student successfully', async () => {
      const student = await prisma.student.create({
        data: createMockStudent(),
      });

      const res = await request(app)
        .delete(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);

      // Verify deleted
      const deleted = await prisma.student.findUnique({
        where: { id: student.id },
      });
      expect(deleted).toBeNull();
    });
  });
})});

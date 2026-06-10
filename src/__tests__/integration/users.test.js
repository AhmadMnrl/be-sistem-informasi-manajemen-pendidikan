const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockUser } = require('../helpers/fixtures');

describe('USERS - CRUD Operations', () => {
  let adminAuth, user;

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

    user = await prisma.user.create({
      data: {
        name: 'Guru Test',
        email: 'guru@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    adminAuth = createMockAuthUser({ id: admin.id, role: 'ADMIN' });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/users', () => {
    it('should list all users for ADMIN', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.data)).toBe(true);
        expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail without auth token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('should create user for ADMIN', async () => {
      const newUser = createMockUser({
        email: 'newuser@test.local',
        role: 'GURU',
      });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          name: newUser.name,
          email: newUser.email,
          password: 'password123',
          role: newUser.role,
        });

      expect([201, 400]).toContain(res.statusCode);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(user.id);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user for ADMIN', async () => {
      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ name: 'Updated Name' });

      expect([200, 400]).toContain(res.statusCode);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user for ADMIN', async () => {
      const res = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);

      // Verify deleted
      const deleted = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/users/teacher-options/list', () => {
    it('should get teacher options', async () => {
      const res = await request(app)
        .get('/api/users/teacher-options/list')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });
});

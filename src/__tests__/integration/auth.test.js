const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, generateToken, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockUser } = require('../helpers/fixtures');

describe('AUTH - Login & JWT', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Setup: Create test user
      const testUser = await prisma.user.create({
        data: {
          name: 'Admin Test',
          email: 'admin@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });

      // Act
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.local',
          password: 'password123',
        });

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data.token');
      expect(res.body.data.user.email).toBe('admin@test.local');
      expect(res.body.success).toBe(true);
    });

    it('should fail with incorrect password', async () => {
      // Setup
      await prisma.user.create({
        data: {
          name: 'Admin Test',
          email: 'admin@test.local',
          passwordHash: await hashPassword('correctPassword'),
          role: 'ADMIN',
        },
      });

      // Act
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.local',
          password: 'wrongPassword',
        });

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email atau password tidak valid');
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notexist@test.local',
          password: 'anypassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail without email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Email|password|Validasi/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should fail without auth token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
    });

    it('should logout successfully with valid token', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          name: 'Logout Test',
          email: 'logouttest@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });
      const { token } = createMockAuthUser({ id: user.id });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

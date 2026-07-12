/**
 * @module AUTH Integration Tests
 * @description Integration tests aligned with the Postman collection.
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('AUTH - /api/auth', () => {
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
    it('01 - Login Berhasil dengan akun terdaftar', async () => {
      await prisma.user.create({
        data: {
          name: 'Admin Test',
          email: 'admin@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.local', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Login berhasil',
      });
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        email: 'admin@test.local',
        role: 'ADMIN',
      });
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('02 - Login Gagal - Password Salah', async () => {
      await prisma.user.create({
        data: {
          name: 'Admin Test',
          email: 'admin@example.com',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'salah123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Email atau password tidak valid',
      });
    });

    it('03 - Login Gagal - Format Email Tidak Valid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bukan-email', password: 'pass123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        message: 'Validasi gagal',
      });
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('04 - Logout Berhasil', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Logout Test',
          email: 'logout@test.local',
          passwordHash: await hashPassword('password123'),
          role: 'ADMIN',
        },
      });
      const { token } = createMockAuthUser({ id: user.id });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Logout berhasil. Silakan hapus token di client.',
      });
    });

    it('05 - Logout Gagal - Tanpa Token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({
        message: 'Unauthorized',
      });
    });
  });
});

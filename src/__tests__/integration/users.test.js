/**
 * @module USERS Integration Tests
 * @description Integration tests aligned with the Postman collection.
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('USERS - /api/users', () => {
  let adminAuth;
  let guruAuth;
  let admin;
  let guru;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    admin = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    guru = await prisma.user.create({
      data: {
        name: 'Guru Test',
        email: 'guru@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    adminAuth = createMockAuthUser({ id: admin.id, role: 'ADMIN' });
    guruAuth = createMockAuthUser({ id: guru.id, role: 'GURU' });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/users', () => {
    it('06 - Mendapatkan Seluruh Daftar Pengguna', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('07 - Mendapatkan Daftar Pengguna Gagal - Diakses Guru', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users', () => {
    it('08 - Menambah Pengguna Baru', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          name: 'Guru Baru',
          email: 'guru-baru@test.local',
          password: 'password123',
          role: 'GURU',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toMatchObject({
        name: 'Guru Baru',
        email: 'guru-baru@test.local',
        role: 'GURU',
      });
    });

    it('09 - Menambah Pengguna Gagal - Email Duplikat', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          name: 'Guru Duplikat',
          email: 'admin@test.local',
          password: 'password123',
          role: 'GURU',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email sudah terdaftar');
    });
  });

  describe('GET /api/users/:id', () => {
    it('10 - Mendapatkan Detail Pengguna berdasarkan ID', async () => {
      const res = await request(app)
        .get(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toMatchObject({
        id: guru.id,
        name: 'Guru Test',
        email: 'guru@test.local',
        role: 'GURU',
      });
    });

    it('11 - Detail Pengguna - ID Tidak Ditemukan', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'User tidak ditemukan');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('12 - Memperbarui Data Pengguna', async () => {
      const res = await request(app)
        .put(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ name: 'Siti Aminah, S.Pd' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', 'Siti Aminah, S.Pd');
    });

    it('13 - Memperbarui Data Pengguna Gagal - Diakses Guru', async () => {
      const res = await request(app)
        .put(`/api/users/${admin.id}`)
        .set('Authorization', `Bearer ${guruAuth.token}`)
        .send({ name: 'Tidak Bisa' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users/:id/photo', () => {
    it('14 - Mengunggah Foto Identitas Pengguna', async () => {
      const res = await request(app)
        .post(`/api/users/${guru.id}/photo`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .attach('photo', Buffer.from('dummy-image-content'), 'avatar.png');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('Foto identitas berhasil diunggah');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('15 - Menghapus Pengguna', async () => {
      const res = await request(app)
        .delete(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('User berhasil dihapus');
    });
  });
});


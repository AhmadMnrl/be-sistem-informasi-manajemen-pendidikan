/**
 * @module USERS Integration Tests
 * @description Production-ready test suite for /api/users endpoints (CRUD + teacher options).
 *
 * Coverage:
 *  - GET    /api/users                  → 200, 401, 403
 *  - POST   /api/users                  → 201, 400 (duplicate/missing), 401, 403
 *  - GET    /api/users/:id              → 200, 404, 401
 *  - PUT    /api/users/:id              → 200, 400, 401, 403
 *  - DELETE /api/users/:id              → 200, 400 (self), 404, 401, 403
 *  - GET    /api/users/options/teachers  → 200, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('USERS - /api/users', () => {
  let adminAuth, guruAuth, admin, guru;

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

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/users
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/users', () => {
    it('should return 200 and paginated user list for ADMIN', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 403 when GURU role accesses', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/users
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/users', () => {
    it('should return 201 and created user data for ADMIN', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          name: 'New User',
          email: 'newuser@test.local',
          password: 'password123',
          role: 'GURU',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'New User');
      expect(res.body.data).toHaveProperty('email', 'newuser@test.local');
      expect(res.body.data).toHaveProperty('role', 'GURU');

      // Verify persisted in database
      const dbUser = await prisma.user.findUnique({ where: { email: 'newuser@test.local' } });
      expect(dbUser).not.toBeNull();
      expect(dbUser.name).toBe('New User');
    });

    it('should return 400 when email already exists', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          name: 'Duplicate User',
          email: 'admin@test.local',
          password: 'password123',
          role: 'GURU',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Email sudah terdaftar');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ name: 'Incomplete User' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'No Auth', email: 'noauth@test.local', password: 'password123', role: 'GURU' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 403 when GURU role tries to create user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${guruAuth.token}`)
        .send({ name: 'Forbidden', email: 'forbidden@test.local', password: 'password123', role: 'GURU' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/users/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/users/:id', () => {
    it('should return 200 and user data when user exists', async () => {
      const res = await request(app)
        .get(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', guru.id);
      expect(res.body.data).toHaveProperty('name', 'Guru Test');
      expect(res.body.data).toHaveProperty('email', 'guru@test.local');
      expect(res.body.data).toHaveProperty('role', 'GURU');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 404 when user does not exist', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('User tidak ditemukan');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get(`/api/users/${guru.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/users/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/users/:id', () => {
    it('should return 200 and updated user data for ADMIN', async () => {
      const res = await request(app)
        .put(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ name: 'Updated Guru Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'Updated Guru Name');

      // Verify persisted in database
      const dbUser = await prisma.user.findUnique({ where: { id: guru.id } });
      expect(dbUser.name).toBe('Updated Guru Name');
    });

    it('should return 400 when updating non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ name: 'Ghost' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .put(`/api/users/${guru.id}`)
        .send({ name: 'No Auth' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 403 when GURU role tries to update', async () => {
      const res = await request(app)
        .put(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${guruAuth.token}`)
        .send({ name: 'Forbidden Update' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/users/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/users/:id', () => {
    it('should return 200 and delete the user successfully', async () => {
      const res = await request(app)
        .delete(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('User berhasil dihapus');

      // Verify deleted from database
      const deleted = await prisma.user.findUnique({ where: { id: guru.id } });
      expect(deleted).toBeNull();
    });

    it('should return 404 when user does not exist', async () => {
      const res = await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('User tidak ditemukan');
    });

    it('should return 400 when ADMIN tries to delete own account', async () => {
      const res = await request(app)
        .delete(`/api/users/${admin.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Tidak dapat menghapus akun sendiri');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).delete(`/api/users/${guru.id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 403 when GURU role tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/users/${guru.id}`)
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/users/options/teachers
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/users/options/teachers', () => {
    it('should return 200 and teacher options array', async () => {
      const res = await request(app)
        .get('/api/users/options/teachers')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return options with label and value fields', async () => {
      const res = await request(app)
        .get('/api/users/options/teachers')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      const options = res.body.data;
      expect(options.length).toBeGreaterThanOrEqual(1);
      expect(options[0]).toHaveProperty('label');
      expect(options[0]).toHaveProperty('value');
    });

    it('should be accessible by GURU role (not ADMIN-only)', async () => {
      const res = await request(app)
        .get('/api/users/options/teachers')
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/users/options/teachers');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/users/:id/photo and POST /api/Users/:id/photo
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/users/:id/photo & /api/Users/:id/photo', () => {
    it('should return 200 and successfully upload identity photo for ADMIN', async () => {
      const res = await request(app)
        .post(`/api/users/${guru.id}/photo`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .attach('photo', Buffer.from('dummy-image-content'), 'avatar.png');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Foto identitas berhasil diunggah');
      expect(res.body).toHaveProperty('data');
      
      const dbUser = await prisma.user.findUnique({ where: { id: guru.id } });
      expect(dbUser.identityPhotoUrl).not.toBeNull();
      expect(dbUser.identityPhotoUrl).toContain('/uploads/images/');
    });

    it('should support capital Users endpoint POST /api/Users/:id/photo', async () => {
      const res = await request(app)
        .post(`/api/Users/${guru.id}/photo`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .attach('photo', Buffer.from('dummy-image-content'), 'avatar.png');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Foto identitas berhasil diunggah');
    });

    it('should return 400 if no photo is attached', async () => {
      const res = await request(app)
        .post(`/api/users/${guru.id}/photo`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app)
        .post('/api/users/99999/photo')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .attach('photo', Buffer.from('dummy-image-content'), 'avatar.png');

      expect(res.statusCode).toBe(404);
    });
  });
});


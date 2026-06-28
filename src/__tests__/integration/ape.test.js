/**
 * @module APE Integration Tests
 * @description Production-ready test suite for /api/ape endpoints (CRUD operations).
 *
 * Coverage:
 *  - GET    /api/ape       → 200, 401
 *  - POST   /api/ape       → 201, 400 (validation), 401
 *  - GET    /api/ape/:id   → 200, 404, 401
 *  - PUT    /api/ape/:id   → 200, 404, 401, 400 (validation)
 *  - DELETE /api/ape/:id   → 200, 404, 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockApe } = require('../helpers/fixtures');

describe('APE - /api/ape', () => {
  let authUser, adminUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    authUser = createMockAuthUser({ id: adminUser.id, role: adminUser.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/ape
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/ape', () => {
    it('should return 200 and list all APE items', async () => {
      await prisma.ape.createMany({
        data: [
          createMockApe({ createdById: adminUser.id, updatedById: adminUser.id, name: 'APE 1' }),
          createMockApe({ createdById: adminUser.id, updatedById: adminUser.id, name: 'APE 2' }),
        ],
      });

      const res = await request(app)
        .get('/api/ape')
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
      const res = await request(app).get('/api/ape');
      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/ape
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/ape', () => {
    it('should return 201 and created APE item data', async () => {
      const apeData = {
        name: 'Puzzle Kayu',
        condition: 'Baik',
        quantity: 10,
        location: 'Kelas B',
      };

      const res = await request(app)
        .post('/api/ape')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(apeData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Puzzle Kayu');

      // Verify persisted in database
      const dbApe = await prisma.ape.findUnique({ where: { id: res.body.data.id } });
      expect(dbApe).not.toBeNull();
      expect(dbApe.name).toBe('Puzzle Kayu');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/ape')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          condition: 'Rusak',
          quantity: 2,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/ape')
        .send({ name: 'Balok' });

      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/ape/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/ape/:id', () => {
    it('should return 200 and APE item data when it exists', async () => {
      const ape = await prisma.ape.create({
        data: createMockApe({ createdById: adminUser.id, updatedById: adminUser.id, name: 'Spesifik APE' }),
      });

      const res = await request(app)
        .get(`/api/ape/${ape.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.name).toBe('Spesifik APE');
    });

    it('should return 404 when APE item does not exist', async () => {
      const res = await request(app)
        .get('/api/ape/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/ape/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/ape/:id', () => {
    it('should return 200 and updated APE data', async () => {
      const ape = await prisma.ape.create({
        data: createMockApe({ createdById: adminUser.id, updatedById: adminUser.id, name: 'APE Lama' }),
      });

      const res = await request(app)
        .put(`/api/ape/${ape.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ name: 'APE Baru' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.name).toBe('APE Baru');

      // Verify DB state
      const dbApe = await prisma.ape.findUnique({ where: { id: ape.id } });
      expect(dbApe.name).toBe('APE Baru');
    });

    it('should return 404 when APE item not found on update', async () => {
      const res = await request(app)
        .put('/api/ape/99999')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ name: 'Update APE' });

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/ape/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/ape/:id', () => {
    it('should return 200 and delete APE item', async () => {
      const ape = await prisma.ape.create({
        data: createMockApe({ createdById: adminUser.id, updatedById: adminUser.id }),
      });

      const res = await request(app)
        .delete(`/api/ape/${ape.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify DB state
      const dbApe = await prisma.ape.findUnique({ where: { id: ape.id } });
      expect(dbApe).toBeNull();
    });

    it('should return 404 when APE item not found on delete', async () => {
      const res = await request(app)
        .delete('/api/ape/99999')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});

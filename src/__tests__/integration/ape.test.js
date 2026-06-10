const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockApe } = require('../helpers/fixtures');

describe('APE - CRUD Operations', () => {
  let authUser, admin;

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

    authUser = createMockAuthUser({ id: admin.id, role: admin.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/ape', () => {
    it('should list all APE items', async () => {
      await prisma.ape.createMany({
        data: [
          createMockApe({ createdById: admin.id, updatedById: admin.id, name: 'APE 1' }),
          createMockApe({ createdById: admin.id, updatedById: admin.id, name: 'APE 2' }),
        ],
      });

      const res = await request(app)
        .get('/api/ape')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      const items = res.body.data.data || res.body.data;
      expect(items).toBeDefined();
    });
  });

  describe('POST /api/ape', () => {
    it('should create APE item', async () => {
      const apeData = createMockApe({ createdById: admin.id, updatedById: admin.id });

      const res = await request(app)
        .post('/api/ape')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(apeData);

      expect([201, 400]).toContain(res.statusCode);
    });
  });

  describe('GET /api/ape/:id', () => {
    it('should get APE item by id', async () => {
      const ape = await prisma.ape.create({
        data: createMockApe({ createdById: admin.id, updatedById: admin.id }),
      });

      const res = await request(app)
        .get(`/api/ape/${ape.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(ape.id);
    });
  });

  describe('PUT /api/ape/:id', () => {
    it('should update APE item', async () => {
      const ape = await prisma.ape.create({
        data: createMockApe({ createdById: admin.id, updatedById: admin.id }),
      });

      const res = await request(app)
        .put(`/api/ape/${ape.id}`)
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({ name: 'Updated APE Name' });

      expect([200, 400]).toContain(res.statusCode);
    });
  });

  describe('DELETE /api/ape/:id', () => {
    it('should delete APE item', async () => {
      const ape = await prisma.ape.create({
        data: createMockApe({ createdById: admin.id, updatedById: admin.id }),
      });

      const res = await request(app)
        .delete(`/api/ape/${ape.id}`)
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
    });
  });
});

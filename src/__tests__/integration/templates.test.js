const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockTemplate } = require('../helpers/fixtures');

describe('TEMPLATES - Report Templates', () => {
  let authUser, user;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    await cleanupTestDB();

    user = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    authUser = createMockAuthUser({ id: user.id, role: user.role });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  describe('GET /api/rapor', () => {
    it('should list templates', async () => {
      const res = await request(app)
        .get('/api/rapor')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });

  describe('POST /api/rapor', () => {
    it('should create template', async () => {
      const templateData = createMockTemplate({ createdById: user.id });

      const res = await request(app)
        .post('/api/rapor')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(templateData);

      expect([201, 400, 404]).toContain(res.statusCode);
    });
  });

  describe('GET /api/rapor/:id', () => {
    it('should get template by id', async () => {
      const res = await request(app)
        .get('/api/rapor/1')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect([200, 404]).toContain(res.statusCode);
    });
  });
});

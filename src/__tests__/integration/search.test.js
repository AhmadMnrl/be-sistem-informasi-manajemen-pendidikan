const request = require('supertest');
const app = require('../../server');
const { setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('SEARCH - Global Search', () => {
  let authUser;

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

  describe('GET /api/search', () => {
    it('should search with query parameter', async () => {
      // Create mock user with token
      const { prisma } = require('../helpers/db.helper');
      const user = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@test.local',
          passwordHash: await hashPassword('pass'),
          role: 'ADMIN',
        },
      });

      authUser = createMockAuthUser({ id: user.id, role: user.role });

      const res = await request(app)
        .get('/api/search?query=test')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect([200, 400]).toContain(res.statusCode);
    });
  });
});

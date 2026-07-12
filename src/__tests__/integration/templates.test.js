/**
 * @module TEMPLATES Integration Tests
 * @description Integration tests aligned with the Postman collection.
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('TEMPLATES - /api/rapor', () => {
  let authUser;
  let adminUser;

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

  describe('GET /api/rapor/templates/active', () => {
    it('65 - Mendapatkan Struktur Template Rapor Aktif', async () => {
      const template = await prisma.reportTemplate.create({
        data: {
          title: 'Template Semester Ganjil',
          year: 2026,
          isActive: true,
          createdById: adminUser.id,
        },
      });

      const section = await prisma.reportSection.create({
        data: {
          templateId: template.id,
          sectionNumber: 1,
          order: 0,
          type: 'TEXT',
          title: 'Aspek Perkembangan Nilai Agama',
          subtitle: 'Anak mampu bersyukur',
        },
      });

      await prisma.reportQuestion.create({
        data: {
          sectionId: section.id,
          text: 'Anak mengucapkan kalimat thoyyibah?',
          order: 0,
          type: 'FREE_TEXT',
        },
      });

      const res = await request(app)
        .get('/api/rapor/templates/active')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('templateId', template.id);
    });
  });

  describe('POST /api/rapor/templates', () => {
    it('66 - Membuat Template Rapor Baru', async () => {
      const res = await request(app)
        .post('/api/rapor/templates')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send({
          title: 'Kurikulum 2026',
          year: 2026,
          data: [
            {
              Section: 'Seksi 1',
              type: 'table',
              Questions: [
                { Question: 'Contoh pertanyaan' },
              ],
            },
          ],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('mode', 'create');
      expect(res.body.data).toHaveProperty('isActive', true);
    });
  });
});

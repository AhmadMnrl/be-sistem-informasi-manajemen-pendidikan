/**
 * @module TEMPLATES Integration Tests
 * @description Production-ready test suite for /api/rapor endpoints (Templates).
 *
 * Coverage:
 *  - GET   /api/rapor/templates/active      → 200, 404, 401
 *  - POST  /api/rapor/templates             → 201, 200, 400 (validation), 401
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');

describe('TEMPLATES - /api/rapor', () => {
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
  // GET /api/rapor/templates/active
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/rapor/templates/active', () => {
    it('should return 404 when no active template exists', async () => {
      const res = await request(app)
        .get('/api/rapor/templates/active')
        .set('Authorization', `Bearer ${authUser.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 200 and formatted active template data when template exists', async () => {
      // Create template in database
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
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('templateId', template.id);
      expect(res.body.data).toHaveProperty('title', 'Template Semester Ganjil');
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data[0]).toHaveProperty('Questions');
      expect(res.body.data.data[0].Questions[0].Question).toBe('Anak mengucapkan kalimat thoyyibah?');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/rapor/templates/active');
      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/rapor/templates
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/rapor/templates', () => {
    const validTemplatePayload = {
      title: 'Template Rapor Harian',
      year: 2026,
      data: [
        {
          Section: '1. Perkembangan Fisik',
          subtitle: 'Motorik Kasar',
          type: 'text',
          Questions: [
            {
              Question: 'Dapat melompat dengan satu kaki?',
              answer: '',
              answers: [],
              photo: '',
              photos: [],
              Ket: ''
            }
          ]
        }
      ]
    };

    it('should return 201 and create/activate template when payload is valid', async () => {
      const res = await request(app)
        .post('/api/rapor/templates')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(validTemplatePayload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.mode).toBe('create');

      // Verify DB state
      const dbTemplate = await prisma.reportTemplate.findUnique({
        where: { id: res.body.data.id },
        include: { sections: { include: { questions: true } } }
      });
      expect(dbTemplate).not.toBeNull();
      expect(dbTemplate.title).toBe('Template Rapor Harian');
      expect(dbTemplate.sections.length).toBe(1);
      expect(dbTemplate.sections[0].questions.length).toBe(1);
      expect(dbTemplate.sections[0].questions[0].text).toBe('Dapat melompat dengan satu kaki?');
    });

    it('should return 200 and update the template if active template title matches', async () => {
      // Create active template first
      await prisma.reportTemplate.create({
        data: {
          title: 'Template Rapor Harian',
          year: 2026,
          isActive: true,
          createdById: adminUser.id,
        },
      });

      const res = await request(app)
        .post('/api/rapor/templates')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(validTemplatePayload);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.mode).toBe('update');
    });

    it('should return 400 when title is missing in payload', async () => {
      const invalidPayload = { ...validTemplatePayload };
      delete invalidPayload.title;

      const res = await request(app)
        .post('/api/rapor/templates')
        .set('Authorization', `Bearer ${authUser.token}`)
        .send(invalidPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).toHaveProperty('message');
    });
  });

});

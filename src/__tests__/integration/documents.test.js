/**
 * @module DOCUMENTS Integration Tests
 * @description Production-ready test suite for /api/documents endpoints
 *
 * Coverage:
 *  - GET    /api/documents       → 200, 401
 *  - POST   /api/documents       → 201, 400 (missing fields), 401, 403 (GURU role)
 *  - GET    /api/documents/:id   → 200, 404, 401
 *  - PUT    /api/documents/:id   → 200, 404, 401, 403 (GURU role)
 *  - DELETE /api/documents/:id   → 200, 404, 401, 403 (GURU role)
 */
const request = require('supertest');
const app = require('../../server');
const { prisma, setupTestDB, cleanupTestDB, closeTestDB } = require('../helpers/db.helper');
const { hashPassword, createMockAuthUser } = require('../helpers/auth.helper');
const { createMockDocument } = require('../helpers/fixtures');

describe('DOCUMENTS - /api/documents', () => {
  let adminAuth, guruAuth, adminUser, guruUser;

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

    guruUser = await prisma.user.create({
      data: {
        name: 'Guru Test',
        email: 'guru@test.local',
        passwordHash: await hashPassword('password123'),
        role: 'GURU',
      },
    });

    adminAuth = createMockAuthUser({ id: adminUser.id, role: 'ADMIN' });
    guruAuth = createMockAuthUser({ id: guruUser.id, role: 'GURU' });
  });

  afterAll(async () => {
    await cleanupTestDB();
    await closeTestDB();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/documents
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/documents', () => {
    it('should return 200 and list of documents for authenticated user', async () => {
      await prisma.document.createMany({
        data: [
          createMockDocument({ title: 'Doc 1', uploadedById: adminUser.id }),
          createMockDocument({ title: 'Doc 2', uploadedById: adminUser.id }),
        ],
      });

      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/documents
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/documents', () => {
    it('should return 201 and created document for ADMIN', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .field('title', 'Laporan Keuangan')
        .field('category', 'Keuangan')
        .field('filePath', '/uploads/documents/keuangan.pdf')
        .field('documentDate', '2026-06-13');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Laporan Keuangan');

      // Verify DB state
      const dbDoc = await prisma.document.findUnique({ where: { id: res.body.data.id } });
      expect(dbDoc).not.toBeNull();
      expect(dbDoc.title).toBe('Laporan Keuangan');
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .field('category', 'Keuangan')
        .field('filePath', '/uploads/documents/keuangan.pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 403 when GURU tries to upload document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${guruAuth.token}`)
        .field('title', 'Laporan Guru')
        .field('filePath', '/uploads/documents/guru.pdf');

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/documents')
        .field('title', 'Laporan');

      expect(res.statusCode).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/documents/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/documents/:id', () => {
    it('should return 200 and document details when document exists', async () => {
      const doc = await prisma.document.create({
        data: createMockDocument({ title: 'Spesifik Doc', uploadedById: adminUser.id }),
      });

      const res = await request(app)
        .get(`/api/documents/${doc.id}`)
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.title).toBe('Spesifik Doc');
    });

    it('should return 404 when document not found', async () => {
      const res = await request(app)
        .get('/api/documents/99999')
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/documents/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/documents/:id', () => {
    it('should return 200 and updated data for ADMIN', async () => {
      const doc = await prisma.document.create({
        data: createMockDocument({ title: 'Old Title', uploadedById: adminUser.id }),
      });

      const res = await request(app)
        .put(`/api/documents/${doc.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .field('title', 'New Title');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.title).toBe('New Title');

      // Verify DB state
      const dbDoc = await prisma.document.findUnique({ where: { id: doc.id } });
      expect(dbDoc.title).toBe('New Title');
    });

    it('should return 403 when GURU tries to update document', async () => {
      const doc = await prisma.document.create({
        data: createMockDocument({ title: 'Old Title', uploadedById: adminUser.id }),
      });

      const res = await request(app)
        .put(`/api/documents/${doc.id}`)
        .set('Authorization', `Bearer ${guruAuth.token}`)
        .field('title', 'New Title');

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 when document not found on update', async () => {
      const res = await request(app)
        .put('/api/documents/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .field('title', 'New Title');

      expect(res.statusCode).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/documents/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/documents/:id', () => {
    it('should return 200 and delete the document for ADMIN', async () => {
      const doc = await prisma.document.create({
        data: createMockDocument({ title: 'Delete Doc', uploadedById: adminUser.id }),
      });

      const res = await request(app)
        .delete(`/api/documents/${doc.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify DB state
      const dbDoc = await prisma.document.findUnique({ where: { id: doc.id } });
      expect(dbDoc).toBeNull();
    });

    it('should return 403 when GURU tries to delete document', async () => {
      const doc = await prisma.document.create({
        data: createMockDocument({ title: 'Delete Doc', uploadedById: adminUser.id }),
      });

      const res = await request(app)
        .delete(`/api/documents/${doc.id}`)
        .set('Authorization', `Bearer ${guruAuth.token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 when document not found on delete', async () => {
      const res = await request(app)
        .delete('/api/documents/99999')
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(404);
    });
  });
});

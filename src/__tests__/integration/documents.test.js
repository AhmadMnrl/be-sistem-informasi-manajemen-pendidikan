/**
 * @module DOCUMENTS Integration Tests
 * @description Integration tests aligned with the Postman collection.
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
    it('35 - Mendapatkan Daftar Dokumen Sekolah', async () => {
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
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/documents
  // ═══════════════════════════════════════════════════════════════════
  describe('POST /api/documents', () => {
    it('37 - Mengunggah Dokumen Sekolah Baru', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .field('title', 'Laporan Keuangan')
        .field('category', 'Keuangan')
        .field('filePath', '/uploads/documents/keuangan.pdf')
        .field('documentDate', '2026-06-13');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.title).toBe('Laporan Keuangan');
    });

    it('38 - Mengunggah Dokumen Baru Gagal - Diakses Guru', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${guruAuth.token}`)
        .field('title', 'Laporan Guru')
        .field('filePath', '/uploads/documents/guru.pdf');

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/documents/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('GET /api/documents/:id', () => {
    it('36 - Mendapatkan Detail Dokumen', async () => {
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
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUT /api/documents/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('PUT /api/documents/:id', () => {
    it('39 - Memperbarui Judul Dokumen', async () => {
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
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DELETE /api/documents/:id
  // ═══════════════════════════════════════════════════════════════════
  describe('DELETE /api/documents/:id', () => {
    it('40 - Menghapus Dokumen Sekolah', async () => {
      const doc = await prisma.document.create({
        data: createMockDocument({ title: 'Delete Doc', uploadedById: adminUser.id }),
      });

      const res = await request(app)
        .delete(`/api/documents/${doc.id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});

/**
 * Test fixtures and factory functions
 */

const createMockStudent = (overrides = {}) => ({
  name: 'Siswa Test 1',
  identifier: 'STU-TEST-001',
  nisn: '1234567890',
  className: 'A',
  tahunAjaran: '2025/2026',
  parentName: 'Orang Tua Test',
  parentPhone: '081234567890',
  address: 'Jl. Test No. 1',
  photoUrl: '/uploads/images/student-test.jpg',
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  name: 'User Test',
  email: 'user@test.local',
  passwordHash: '$2a$10$test', // Dummy hash
  role: 'GURU',
  ...overrides,
});

const createMockReport = (overrides = {}) => ({
  title: 'Laporan Test',
  description: 'Laporan untuk testing',
  photoUrl: '/uploads/images/report-test.jpg',
  studentId: 1,
  teacherId: 1,
  ...overrides,
});

const createMockDocument = (overrides = {}) => ({
  title: 'Dokumen Test',
  category: 'Test',
  filePath: '/uploads/documents/doc-test.pdf',
  documentDate: new Date(),
  uploadedById: 1,
  ...overrides,
});

const createMockAnecdote = (overrides = {}) => ({
  content: 'Anekdot test content',
  description: 'Test anecdote untuk testing',
  category: 'Test',
  date: new Date(),
  imageUrl: '/uploads/images/anecdote-test.jpg',
  teacherId: 1,
  ...overrides,
});

const createMockQuestion = (overrides = {}) => ({
  text: 'Pertanyaan test?',
  section: 'Section Test',
  imageUrl: null,
  teacherId: 1,
  ...overrides,
});

const createMockApe = (overrides = {}) => ({
  name: 'APE Test Item',
  condition: 'Baik',
  quantity: 5,
  location: 'Ruang Test',
  createdById: 1,
  updatedById: 1,
  ...overrides,
});

const createMockTemplate = (overrides = {}) => ({
  title: 'Template Test',
  year: 2026,
  isActive: true,
  createdById: 1,
  ...overrides,
});

module.exports = {
  createMockStudent,
  createMockUser,
  createMockReport,
  createMockDocument,
  createMockAnecdote,
  createMockQuestion,
  createMockApe,
  createMockTemplate,
};

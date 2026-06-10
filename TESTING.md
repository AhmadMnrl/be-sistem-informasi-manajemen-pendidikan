# Testing Guide

## Overview
Comprehensive automated testing suite untuk API menggunakan Jest dan Supertest. Menjalankan seluruh test coverage dengan detailed reporting untuk setiap endpoint.

## Quick Start

```bash
# Install dependencies (jika belum)
npm install

# Jalankan semua tests
npm test

# Watch mode (untuk development)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Prerequisites

### Database Setup
Test database sudah dikonfigurasi di `.env.test`:
```
DATABASE_URL=mysql://root:@localhost:3306/pospaud_test
JWT_SECRET=test-secret-key-12345
PORT=3001
```

Sebelum menjalankan tests:
1. Pastikan MySQL server running
2. Buat database `pospaud_test`:
   ```sql
   CREATE DATABASE pospaud_test;
   ```

### Environment Configuration
Tests menggunakan `.env.test` untuk isolasi dari production.

## Test Structure

```
src/__tests__/
├── helpers/
│   ├── auth.helper.js          # JWT token generation, password hashing
│   ├── db.helper.js            # Database setup/cleanup, Prisma client
│   └── fixtures.js             # Mock data factories
└── integration/
    ├── auth.test.js            # Authentication tests
    ├── students.test.js        # Student CRUD tests
    ├── users.test.js           # User management tests
    ├── reports.test.js         # Report CRUD tests
    ├── documents.test.js       # Document CRUD tests
    ├── anecdotes.test.js       # Anecdote CRUD tests
    ├── questions.test.js       # Question CRUD tests
    ├── ape.test.js             # APE (Learning Tools) CRUD tests
    ├── studentReports.test.js  # Student Report tests
    ├── logs.test.js            # Activity Logs tests
    ├── search.test.js          # Global Search tests
    ├── summary.test.js         # Summary/Dashboard tests
    └── templates.test.js       # Report Templates tests
```

## Test Coverage

### Authentication (auth.test.js)
- ✓ Login dengan credentials yang benar
- ✓ Login dengan password yang salah
- ✓ Login dengan email yang tidak ada
- ✓ Logout

### Students (students.test.js)
- ✓ List semua siswa dengan pagination
- ✓ Create siswa baru
- ✓ Get siswa by ID
- ✓ Update siswa
- ✓ Delete siswa
- ✓ Authorization checks

### Users (users.test.js)
- ✓ List users (admin only)
- ✓ Create user
- ✓ Get user by ID
- ✓ Update user
- ✓ Delete user
- ✓ Teacher options

### Reports (reports.test.js)
- ✓ List reports
- ✓ Create report
- ✓ Get report by ID
- ✓ Update report
- ✓ Delete report

### Documents (documents.test.js)
- ✓ List documents
- ✓ Create document dengan file upload
- ✓ Get document by ID
- ✓ Update document
- ✓ Delete document

### Anecdotes (anecdotes.test.js)
- ✓ List anecdotes
- ✓ Create anecdote
- ✓ Get anecdote by ID
- ✓ Update anecdote
- ✓ Delete anecdote

### Questions (questions.test.js)
- ✓ List questions
- ✓ Create question
- ✓ Get question by ID
- ✓ Update question
- ✓ Delete question

### APE (ape.test.js)
- ✓ List APE items
- ✓ Create APE item
- ✓ Get APE item by ID
- ✓ Update APE item
- ✓ Delete APE item

### Student Reports (studentReports.test.js)
- ✓ List student reports
- ✓ Create student report
- ✓ Get student report by ID

### Additional Tests
- Logs: Activity log tracking
- Search: Global search functionality
- Summary: Dashboard summary data
- Templates: Report templates CRUD

## Running Tests

### Run All Tests
```bash
npm test
```

Output akan menampilkan:
- Total test suites passed/failed
- Total tests passed/failed
- Detailed error messages untuk failed tests
- Test execution time

### Run Specific Test File
```bash
npm test -- auth.test.js
npm test -- students.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="login"
npm test -- --testNamePattern="CRUD"
```

### Watch Mode (untuk development)
```bash
npm run test:watch
```

Akan automatically rerun tests saat file berubah.

### Coverage Report
```bash
npm run test:coverage
```

Generate coverage report di `coverage/` directory dengan breakdown:
- Statements coverage
- Branches coverage
- Functions coverage
- Lines coverage

## Test Database Lifecycle

Setiap test suite:
1. **beforeAll**: Setup test database connection
2. **beforeEach**: Clean database (delete all data)
3. **Test execution**: Tests run dengan clean database
4. **afterAll**: Cleanup dan close database connection

Database automatically reset sebelum setiap test untuk memastikan isolation.

## Key Test Patterns

### Auth Test
```javascript
const authUser = createMockAuthUser({ id: user.id, role: user.role });
const res = await request(app)
  .post('/api/endpoint')
  .set('Authorization', `Bearer ${authUser.token}`)
  .send(data);
```

### Database Fixtures
```javascript
const student = await prisma.student.create({
  data: createMockStudent({ name: 'Test Name' })
});
```

### Assertion Examples
```javascript
expect(res.statusCode).toBe(200);
expect(res.body.success).toBe(true);
expect(res.body.data).toHaveProperty('id');
expect(res.body.data.length).toBeGreaterThan(0);
```

## Troubleshooting

### Tests Timeout
```javascript
// Increase timeout di jest.config.js atau dalam test:
jest.setTimeout(30000);
```

### Database Connection Failed
- Pastikan MySQL server running: `mysql -u root`
- Pastikan database `pospaud_test` ada
- Verify DATABASE_URL di `.env.test`

### File Not Found Errors
Pastikan test files di dalam `src/__tests__/integration/` directory.

### JWT Token Errors
Helper function `createMockAuthUser()` automatically generate valid JWT token dengan JWT_SECRET dari `.env.test`.

## Continuous Integration

Untuk CI/CD pipeline, add ke workflow file:
```yaml
- name: Run Tests
  run: npm test -- --coverage --watchAll=false
```

## Monitoring & Reporting

After running tests, check:
1. **Console output**: Detailed test results
2. **Coverage report**: `coverage/index.html` untuk visual report
3. **Failed tests**: Error messages show exactly dimana dan apa yang failed

## User Expectations

Tests dirancang untuk:
- ✓ Tidak expect semua tests pass di awal
- ✓ Provide detailed error reporting: "detail jika ada error dimana nya dan berapa hasilnya"
- ✓ Support continuous testing: "terus melakukan test"
- ✓ Identify issues quickly dengan clear error messages dan stack traces

# File Path Synchronization Guide

## Problem

Frontend mengalami error: `Cannot GET //uploads/documents/document-10.pdf`

- Double slash muncul dari inkonsistensi path handling

## Solution

Semua controller sekarang menggunakan utility function yang centralized di `src/utils/filePath.js`

### File Path Format

Semua file path harus dalam format: `/uploads/{type}/{filename}`

- Selalu dimulai dengan `/`
- Type: `images` atau `documents`
- Contoh: `/uploads/images/student-1.jpg`, `/uploads/documents/file-name.pdf`

### Utility Functions

#### buildImagePath(filename)

Bikin path untuk gambar

```javascript
buildImagePath("student-1.jpg"); // → /uploads/images/student-1.jpg
```

#### buildDocumentPath(filename)

Bikin path untuk dokumen

```javascript
buildDocumentPath("laporan.pdf"); // → /uploads/documents/laporan.pdf
```

#### normalizeFilePath(filePath)

Normalize berbagai format path jadi `/uploads/...`

```javascript
normalizeFilePath("/uploads/images/test.jpg"); // → /uploads/images/test.jpg
normalizeFilePath("uploads/images/test.jpg"); // → /uploads/images/test.jpg
normalizeFilePath("test.jpg"); // → /test.jpg (error case)
```

### Controllers Updated

✅ documents.controller.js
✅ anecdotes.controller.js
✅ students.controller.js
✅ reports.controller.js
✅ seeds/seed.js

### API Response Format

Semua response return path dalam format: `/uploads/{type}/{filename}`

Contoh GET /api/documents response:

```json
{
  "status": 201,
  "message": "Dokumen berhasil dibuat",
  "data": {
    "id": 1,
    "title": "Laporan",
    "filePath": "/uploads/documents/document-1.pdf",
    "uploadedById": 2
  }
}
```

### Frontend Usage

Frontend tinggal pakai value dari response:

```javascript
// ❌ JANGAN
const url = host + data.filePath + "/"; // → http://localhost:3000//uploads/documents/...

// ✅ GUNAKAN
const url = host + data.filePath; // → http://localhost:3000/uploads/documents/...
```

### Static File Serving

Express sudah setup di `src/server.js`:

```javascript
app.use("/uploads", express.static("uploads"));
```

Semua file bisa diakses langsung: `http://localhost:3000/uploads/documents/file.pdf`

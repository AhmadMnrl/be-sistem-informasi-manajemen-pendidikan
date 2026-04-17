# Code Scan Report - BE Sistem Informasi Manajemen Pendidikan

**Tanggal Scan:** 14 April 2026  
**Scope:** Full codebase scanning untuk error, defects, dan best practices

---

## 🔴 CRITICAL ISSUES

### 1. **Schema Mismatch di Documents Controller**

**File:** `src/controllers/documents.controller.js`  
**Severity:** HIGH  
**Issue:** Field naming inconsistency antara schema dan controller

- Controller menggunakan: `fileUrl`, `uploadedBy`
- Schema Prisma mendefinisikan: `filePath`, `uploadedById`
- Akibat: **Gagal saat CREATE/UPDATE dokumen**

**Rekomendasi:**

```javascript
// Ubah ke yang benar sesuai schema:
const created = await prisma.document.create({
  data: {
    title,
    category: category || null,
    documentDate: documentDate ? new Date(documentDate) : new Date(),
    filePath: req.file ? `/uploads/documents/${req.file.filename}` : null, // ✅ filePath bukan fileUrl
    uploadedById: req.user.id, // ✅ uploadedById bukan uploadedBy
  },
});
```

---

### 2. **Missing ID Validation di Multiple Endpoints**

**Files:**

- `src/controllers/students.controller.js`
- `src/controllers/users.controller.js`
- `src/controllers/questions.controller.js`
- `src/controllers/anecdotes.controller.js`
- `src/controllers/ape.controller.js`

**Severity:** HIGH  
**Issue:** Endpoint GET/UPDATE/DELETE tidak validasi apakah ID valid sebelum query database

- Bisa mengakibatkan error Prisma atau query tidak terduga
- `reports.controller.js` sudah benar dengan validasi `if (!Number.isInteger(id) || id <= 0)`

**Rekomendasi:** Tambahkan validasi di semua controller seperti di `reports.controller.js`:

```javascript
const id = Number(req.params.id);
if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
```

---

### 3. **NaN Handling di reports.controller.js**

**File:** `src/controllers/reports.controller.js` line 6  
**Severity:** MEDIUM  
**Issue:**

```javascript
const studentId = Number(req.query.studentId);
const where = studentId ? { studentId } : undefined;
```

Jika `studentId` adalah string non-numeric, `Number()` akan return `NaN`, dan `NaN ? ...` akan true.

**Rekomendasi:**

```javascript
const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
const where = studentId && Number.isInteger(studentId) ? { studentId } : undefined;
```

---

## 🟠 MEDIUM ISSUES

### 4. **JWT Secret Hardcoding**

**Files:**

- `src/middleware/auth.js` line 6
- `src/controllers/auth.controller.js` line 11

**Severity:** MEDIUM (Security)  
**Issue:** Default JWT_SECRET hardcoded sebagai `'dev-secret'`

```javascript
const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
```

**Rekomendasi:**

```javascript
// Di .env file
JWT_SECRET=your-super-secret-key-here-minimum-32-chars

// Di code, JANGAN fallback
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET tidak ditemukan di environment');
const payload = jwt.verify(token, SECRET);
```

---

### 5. **Inconsistent Error Handling**

**Multiple Files:** controllers/\*\*

**Severity:** MEDIUM  
**Issue:** Beberapa endpoint tidak consistent dalam menangani error:

```javascript
// ❌ Terkadang catch error tapi return 400 generic
catch (e) {
  return sendResponse(res, 400, 'Gagal membuat rapor', { error: e?.message });
}

// ❌ Terkadang catch error tapi return 404
catch (e) {
  return sendResponse(res, 404, 'Rapor tidak ditemukan');
}

// ✅ Lebih konsisten: log error, return appropriate status
catch (error) {
  console.error('❌ action error:', error);
  return sendResponse(res, 500, 'Gagal melakukan action');
}
```

---

### 6. **Missing Validation di Query Parameters**

**Files:**

- `src/controllers/search.controller.js`
- `src/controllers/students.controller.js`
- Query parameter seperti `page`, `pageSize` tidak always validated

**Severity:** MEDIUM  
**Issue:** Malicious atau invalid query bisa bypass pagination bounds

- `search.controller.js` **sudah bagus**: validasi dengan `Math.max/Math.min`
- Tapi file lain menggunakan langsung dari req.query

**Rekomendasi:** Selalu normalize query params sebelum pakai

---

## 🟡 MINOR ISSUES

### 7. **Unused Variable di Template Controller**

**File:** `src/controllers/templates.controller.js`  
**Severity:** MINOR  
**Issue:** `sectionNumber` di line 82 dihitung tapi `sectionNumber` juga di line sectionNumber diset ulang:

```javascript
const sectionNumber = Number(String(sec.Section).split(".")[0]) || i;
// kemudian tidak digunakan untuk apapun spesifik
```

---

### 8. **No Validation untuk Required Fields di Templates**

**File:** `src/controllers/templates.controller.js`  
**Severity:** MINOR  
**Issue:** `createTemplateFromUi` tidak validasi:

- Apakah `data` empty
- Apakah `sec.Section` ada untuk setiap section
- Apakah `q.Question` ada untuk setiap question

**Rekomendasi:** Tambah validasi di validator schema atau di controller

---

### 9. **Inconsistent Pagination Response Format**

**Issue:** Document list vs lainnya mungkin format pagination berbeda

**Rekomendasi:** Standardisasi format response pagination di semua endpoint

---

## 🟢 BEST PRACTICES TO CONSIDER

### 10. **Rate Limiting**

- Tidak ada rate limiting di login endpoint (bisa brute force)
- Rekomendasi: tambah middleware rate limiting

### 11. **Input Sanitization**

- File uploads tidak fully sanitized (nama file bisa vulnerable)
- Already handled dengan baik di `upload.js` tapi bisa ditingkat

### 12. **Logging & Monitoring**

- Activity logging bagus ✅
- Tapi error logging bisa lebih structured (JSON format)

### 13. **Transaction Handling**

- `submitStudentReport` melakukan multiple creates tanpa transaction
- Jika salah satu gagal, data bisa inconsistent
- Rekomendasi: gunakan `prisma.$transaction()`

---

## 📋 SUMMARY

| Kategori        | Jumlah | Status              |
| --------------- | ------ | ------------------- |
| Critical Issues | 3      | ⚠️ **HARUS FIX**    |
| Medium Issues   | 4      | ⚠️ Harus diperbaiki |
| Minor Issues    | 3      | ℹ️ Optional         |
| **Total**       | **10** | -                   |

---

## ✅ WHAT'S GOOD

1. ✅ Authorization middleware solid
2. ✅ Pagination utility well implemented
3. ✅ Activity logging comprehensive
4. ✅ File upload validation dengan filter mime type
5. ✅ Seed data lengkap dan terstruktur
6. ✅ Route organization clear
7. ✅ Error handling di report controller sudah paling baik

---

## 🎯 PRIORITY FIX ORDER

### Phase 1 (URGENT - Deploy blocker):

1. Fix Document schema mismatch (fileUrl → filePath, uploadedBy → uploadedById)
2. Add ID validation di semua GET/UPDATE/DELETE endpoints

### Phase 2 (IMPORTANT):

3. Fix JWT secret handling
4. Standardize error handling di semua controllers
5. Add query parameter validation

### Phase 3 (NICE TO HAVE):

6. Add rate limiting
7. Use transactions di multi-step operations
8. Improve logging format

---

**Report Generated:** 2026-04-14  
**Reviewer:** Code Scan Agent

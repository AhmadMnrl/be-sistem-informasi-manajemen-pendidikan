# Fixes Applied from Code Scan

## ✅ COMPLETED FIXES

### 1. Fixed Document Schema Mismatch (CRITICAL)

**File:** `src/controllers/documents.controller.js`  
**Changes:**

- `createDocument()`: Changed `fileUrl` → `filePath`, `uploadedBy` → `uploadedById`
- `updateDocument()`: Changed `fileUrl` → `filePath`

**Status:** ✅ APPLIED

---

### 2. Fixed Template Type Mapping (CRITICAL)

**File:** `src/controllers/templates.controller.js`  
**Changes:**

- Fixed `mapSectionType()` function to correctly map:
  - `TEXT` enum → `"text"` (was mapping to `"table"`)
  - `TABLE` enum → `"table"`
  - `MIXED` enum → `"table"`

**Status:** ✅ APPLIED

---

### 3. Added ID Validation to Reports Controller (HIGH)

**File:** `src/controllers/reports.controller.js`  
**Changes:**

- Added validation in `getReport()`, `updateReport()`, `deleteReport()`
- Pattern: `if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, 'id tidak valid');`

**Status:** ✅ APPLIED

---

## ⏳ PENDING FIXES (MANUAL)

### 1. Add ID Validation to Students Controller

**File:** `src/controllers/students.controller.js`  
**Affected Functions:** `getStudent()`, `deleteStudent()`  
**Action Needed:** Add same validation pattern as reports controller

```javascript
if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
```

---

### 2. Add ID Validation to Other Controllers

Apply to these files:

- `src/controllers/users.controller.js` - `getUser()`, `updateUser()`, `deleteUser()`
- `src/controllers/questions.controller.js` - `getQuestion()`, `updateQuestion()`, `deleteQuestion()`
- `src/controllers/anecdotes.controller.js` - `getAnecdote()`, `updateAnecdote()`, `deleteAnecdote()`
- `src/controllers/ape.controller.js` - `getApe()`, `updateApe()`, `deleteApe()`
- `src/controllers/documents.controller.js` - `getDocument()`, `updateDocument()`, `deleteDocument()`

---

### 3. Fix NaN Handling in Reports Controller

**File:** `src/controllers/reports.controller.js` line 6  
**Current:**

```javascript
const studentId = Number(req.query.studentId);
const where = studentId ? { studentId } : undefined;
```

**Should Be:**

```javascript
const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
const where = studentId && Number.isInteger(studentId) ? { studentId } : undefined;
```

---

### 4. Secure JWT_SECRET

**Files:**

- `src/middleware/auth.js`
- `src/controllers/auth.controller.js`

**Action:**

1. Create strong secret in `.env`: `JWT_SECRET=your-min-32-char-secret-key`
2. Remove fallback `|| 'dev-secret'` from code
3. Add validation that JWT_SECRET exists on startup

---

### 5. Standardize Error Handling

**Pattern to Follow:**

```javascript
try {
  // ... operation
} catch (error) {
  console.error("❌ operationName error:", error);
  return sendResponse(res, 500, "Gagal melakukan operasi");
}
```

Apply consistently across all controllers

---

## 📊 SCAN SUMMARY

| Issue Type         | Count | Status      |
| ------------------ | ----- | ----------- |
| Critical (Applied) | 2     | ✅ DONE     |
| High (Applied)     | 1     | ✅ DONE     |
| Medium (Pending)   | 4     | ⏳ TO DO    |
| Minor (Pending)    | 3     | ℹ️ OPTIONAL |

---

## 🚀 NEXT STEPS

1. **Immediate:** Test documents endpoints after fileUrl/uploadedBy fix
2. **This Week:** Add ID validation to remaining controllers
3. **Before Production:**
   - Secure JWT_SECRET in environment
   - Add rate limiting to login endpoint
   - Implement transaction handling in multi-step operations

---

**Last Updated:** 2026-04-14  
**Full Report:** See `CODE_SCAN_REPORT.md`

# Catatan: Filter per kolom (APE, Anecdote, Question, Report, Logs)

Tujuan: menambahkan kemampuan filter berdasarkan beberapa kolom pada endpoint list, mengikuti pola seperti `students`.

## Ringkasan implementasi

### APE (`src/controllers/ape.controller.js`)
Endpoint: `GET /api/apes` (route tidak diubah)

Filter query yang didukung:
- `q` (alias tetap): filter `name` contains (insensitive)
- `name`: filter `name` contains (insensitive)
- `condition`: filter `condition` equals
- `location`: filter `location` equals
- `quantityFrom` dan/atau `quantityTo`: filter range `quantity` (gte/lte)

### ANECDOTES (`src/controllers/anecdotes.controller.js`)
Endpoint: `GET /api/anecdotes`

Filter query yang didukung:
- `q`: filter `content` contains (insensitive)
- `category`: filter `category` equals
- `teacherId`: filter `teacherId` equals
- `dateFrom` dan/atau `dateTo`: filter range `date` (gte/lte)

### QUESTIONS (`src/controllers/questions.controller.js`)
Endpoint (existing):
- `GET /questions/` dan `GET /questions/sections`
- `listQuestions` -> `listQuestionSections`

Filter query yang didukung pada list section:
- `q`: filter `text` contains (insensitive)
- `section`: filter `section` equals
- `teacherId`: filter `teacherId` equals
- `type`: filter `type` equals

Catatan: endpoint ini menggunakan `groupBy` berdasarkan kolom `section`.

### REPORTS (`src/controllers/reports.controller.js`)
Endpoint: `GET /reports`

Filter query yang didukung:
- `studentId`: filter `studentId` equals
- `teacherId`: filter `teacherId` equals
- `title`: filter `title` contains (insensitive)
- `dateFrom` dan/atau `dateTo`: filter range `date` (gte/lte)

### LOGS (`src/controllers/logs.controller.js`)
Endpoint: `GET /logs` (middleware authorize ADMIN tetap)

Filter query yang didukung:
- `action`: filter `action` equals
- `entity`: filter `entity` equals
- `entityIdFrom`/`entityIdTo`: range untuk `entityId` (gte/lte)
- `userId`: filter `userId` equals
- `dateFrom`/`dateTo`: range untuk `createdAt` (gte/lte)

## Daftar file yang diubah
- `src/controllers/ape.controller.js`
- `src/controllers/anecdotes.controller.js`
- `src/controllers/questions.controller.js`
- `src/controllers/reports.controller.js`
- `src/controllers/logs.controller.js`



# Catatan Hak Akses Role

## Role di sistem

- `ADMIN`
- `KEPALA_SEKOLAH`
- `GURU`

## Aturan middleware saat ini

Di middleware `authorize(...)`, ada aturan khusus:

- `ADMIN` **dan** `KEPALA_SEKOLAH` otomatis lolos semua pengecekan `authorize(...)`.
- `GURU` hanya lolos jika rolenya disebut di parameter `authorize(...)`.

Dampak:

- Endpoint yang ditandai `authorize('ADMIN')` saat ini **tetap bisa diakses** oleh `KEPALA_SEKOLAH`.

## Ringkasan akses endpoint (implementasi saat ini)

### Publik (tanpa login)

- `GET /api`
- `GET /`
- `GET /health`
- `POST /api/auth/login`

### Authenticated (semua role: ADMIN, KEPALA_SEKOLAH, GURU)

- `POST /api/auth/logout`
- `GET /api/users/options/teachers`
- `GET /api/students/options`
- `GET|POST|PUT|DELETE /api/students/*`
- `GET|POST|PUT|DELETE /api/reports/*`
- `GET|POST|PUT|DELETE /api/anecdotes/*`
- `GET|POST|PUT|DELETE /api/questions/*`
- `GET|POST|PUT|DELETE /api/ape/*`
- `GET /api/summary`
- `GET /api/rapor/templates/active`
- `POST /api/rapor/templates`
- `PATCH /api/rapor/templates/:id/activate`
- `GET|POST|PUT|DELETE /api/student-reports/*`
- `GET|POST|PUT|DELETE /api/reports/student-reports/*` (alias route)

### Khusus ADMIN + KEPALA_SEKOLAH

- `POST|PUT|DELETE /api/documents/*`

### Khusus ADMIN (secara niat route)

- `GET|POST|PUT|DELETE /api/users/*` (kecuali `/options/teachers`)
- `GET /api/logs`

> Catatan penting: karena logika `authorize(...)` saat ini, endpoint “khusus ADMIN” di atas juga dapat diakses `KEPALA_SEKOLAH`.

## Rekomendasi perbaikan (opsional)

Jika ingin benar-benar membedakan ADMIN vs KEPALA_SEKOLAH, ubah middleware `authorize(...)` agar tidak otomatis meloloskan `KEPALA_SEKOLAH` untuk semua endpoint.

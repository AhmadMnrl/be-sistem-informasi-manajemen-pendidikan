# REST API SIM Pendidikan POS PAUD Melati Azzahra

API untuk manajemen data lembaga (users, siswa, rapor, dokumen akreditasi, anekdot/berita harian, soal, APE), autentikasi JWT, RBAC (Admin, Kepala Sekolah, Guru), pencarian, log aktivitas, dan ringkasan statistik.

## Teknologi
- Node.js + Express.js
- Prisma ORM + MySQL (Laragon)
- JWT (jsonwebtoken), bcryptjs
- Multer (upload file), CORS, Morgan
- Zod (validasi)

## Persiapan & Menjalankan
1) Konfigurasi database di `.env` (sudah dibuat):
```
DATABASE_URL="mysql://root:@localhost:3306/pos_paud_melati_azzahra"
JWT_SECRET="ubah-ini-untuk-produksi"
```
2) Install dependencies:
```
npm install
```
3) Generate client & migrasi (sudah dilakukan otomatis saat setup):
```
npx prisma generate
npx prisma migrate deploy
```
4) Seed data dummy (users, siswa, rapor, dokumen dummy, anekdot, soal, APE):
```
npm run seed
```
5) Jalankan server dev:
```
npm run dev
```
- Health check: GET http://localhost:3000/health

Akun dummy:
- Admin: admin@local.test / admin123
- Kepala Sekolah: kepsek@local.test / kepsek123
- Guru: guru1@local.test / guru12345 (juga ada guru2)

## Arsitektur & Struktur Folder
```
src/
	server.js                 # inisialisasi express, routes, error handler
	prisma.js                 # prisma client
	middleware/
		auth.js                 # verifikasi JWT
		authorize.js            # cek role
		upload.js               # konfigurasi multer
		validate.js            # middleware validasi Zod
	routes/                   # hanya mapping endpoint -> controller
		*.routes.js
	controllers/             # logika bisnis per domain
		*.controller.js
	utils/activityLog.js     # helper tulis log aktivitas
	seeds/seed.js            # isi data dummy
prisma/
	schema.prisma            # schema DB Prisma (MySQL)
```

## Role & Akses (ringkas)
- Admin: semua fitur, kelola users.
- Kepala Sekolah: kelola dokumen akreditasi, kelola APE.
- Guru: kelola anekdot/berita harian, kelola rapor, kelola soal.
- Semua role dapat membaca data umum (dengan batasan yang sudah di-route).

## Alur Autentikasi
1) Login -> POST /api/auth/login (email, password)
2) Terima `token` JWT -> simpan di client (Authorization: Bearer <token>)
3) Ambil profil -> GET /api/auth/me
4) Akses endpoint lain dengan header Authorization Bearer

## Konvensi Upload
- Gambar (siswa, rapor, anekdot, soal): field form-data `photo` atau `image`
- Dokumen akreditasi: field form-data `file`
- File disimpan di `uploads/images` dan `uploads/documents`, di-serve via `GET /uploads/...`

## Validasi & Error Handling
- Validasi input menggunakan Zod pada middleware `validate`
- Error server di-handle oleh error handler global -> respon 500 generic
- Error validasi -> 400 dengan detail `errors`

---

## Dokumentasi Endpoint
Autentikasi diperlukan untuk semua endpoint kecuali `/health`. Gunakan header:
```
Authorization: Bearer <token>
```

### Auth
- POST `/api/auth/login`
  - body: `{ email, password }`
  - respon: `{ token, user }`
- POST `/api/auth/register` (Admin)
  - body: `{ name, email, password, role }` role ∈ ADMIN|KEPALA_SEKOLAH|GURU
- GET `/api/auth/me`

### Users (Admin)
- GET `/api/users`
- POST `/api/users` body: `{ name, email, password, role }`
- GET `/api/users/:id`
- PUT `/api/users/:id` body opsional: `{ name, email, password, role }`
- DELETE `/api/users/:id`

### Students
- GET `/api/students?q=...`
- POST `/api/students` (multipart form-data): fields siswa + file `photo` opsional
- GET `/api/students/:id`
- PUT `/api/students/:id` (multipart form-data): fields opsional + file `photo` opsional
- DELETE `/api/students/:id`

### Reports (Rapor) — Guru/Admin tulis
- GET `/api/reports?studentId=...`
- POST `/api/reports` (Guru/Admin) form-data: `studentId`, `title`, opsional `description`, `date`, file `photo`
- GET `/api/reports/:id`
- PUT `/api/reports/:id` (Guru/Admin) form-data opsional + file `photo`
- DELETE `/api/reports/:id` (Guru/Admin)

### Documents (Akreditasi) — Kepsek/Admin tulis
- GET `/api/documents?q=...`
- POST `/api/documents` (Kepsek/Admin) form-data: `title`, opsional `category`, file `file`
- GET `/api/documents/:id`
- PUT `/api/documents/:id` (Kepsek/Admin) form-data opsional `file`
- DELETE `/api/documents/:id` (Kepsek/Admin)
- GET `/api/documents/:id/download` (unduh file)

### Anecdotes (Guru tulis)
- GET `/api/anecdotes?studentId=...`
- POST `/api/anecdotes` (Guru) form-data: `content`, opsional `date`, `studentId`, file `image`
- GET `/api/anecdotes/:id`
- PUT `/api/anecdotes/:id` (Guru) form-data opsional + file `image`
- DELETE `/api/anecdotes/:id` (Guru)

### Questions (Guru tulis)
- GET `/api/questions?q=...`
- POST `/api/questions` (Guru) form-data: `text`, file `image` opsional
- GET `/api/questions/:id`
- PUT `/api/questions/:id` (Guru) form-data opsional + file `image`
- DELETE `/api/questions/:id` (Guru)

### APE (Admin/Kepsek)
- GET `/api/ape?q=...`
- POST `/api/ape` body: `{ name, condition?, quantity?, location? }`
- GET `/api/ape/:id`
- PUT `/api/ape/:id` body opsional di atas
- DELETE `/api/ape/:id`

### Logs (Admin)
- GET `/api/logs` — 200 log terakhir

### Search Gabungan
- GET `/api/search?q=...&page=1&pageSize=10` — kembalikan `students`, `documents`, `reports` + total

### Summary (Ringkasan)
- GET `/api/summary?period=month|day|year` ATAU `?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - respon: `{ period: {start,end}, studentsCount, reportsCount, documentsCount, anecdotesCount }`

---

## Alur Sistem Singkat
- User login -> dapat JWT -> akses endpoint sesuai role.
- Aksi penting (login, CRUD) dicatat di `ActivityLog`.
- Upload file disimpan di `uploads/...` dan pathnya di DB.
- Pencarian lintas entity tersedia via `/api/search`.
- Ringkasan statistik via `/api/summary`.

## Panduan Menambah Fitur Baru
1) Definisikan schema data di `prisma/schema.prisma` (jika perlu tabel baru)
2) Jalankan migrasi:
```
npx prisma migrate dev --name add_<fitur>
```
3) Buat controller di `src/controllers/<fitur>.controller.js`
4) Tambah validator Zod (opsional tapi direkomendasikan) di `src/validators/schemas.js`
5) Buat route di `src/routes/<fitur>.routes.js` yang memanggil controller + middleware (auth/authorize/validate/upload)
6) Daftarkan route di `src/server.js`
7) Tambah seed data dummy di `src/seeds/seed.js` bila diperlukan, lalu `npm run seed`
8) Uji endpoint (Postman/Insomnia) + cek logs

## Panduan Memperbaiki Fitur (Bugfix)
1) Reproduksi error (cek request, payload, role user)
2) Cek controller terkait di `src/controllers/*`
3) Cek validasi di `src/validators/schemas.js`
4) Cek route & middleware (auth/authorize/validate/upload)
5) Perbaiki, jalankan `npm run dev`, cek ulang
6) Jika menyangkut data, buat migrasi Prisma dengan nama deskriptif

## Konvensi & Best Practices
- Controller ringkas, hindari nested logic dalam
- Validasi di middleware `validate` (Zod)
- RBAC via `authorize` di routes
- Jangan lempar error tanpa makna; gunakan response 4xx/5xx yang jelas
- Nama field konsisten dengan schema Prisma

## Catatan Produksi
- Set `JWT_SECRET` kuat
- Backup MySQL rutin
- Pertimbangkan penyimpanan file di object storage (S3/MinIO) + CDN
- Tambah rate limiting & CORS whitelist
- Audit akses & logging lebih detail

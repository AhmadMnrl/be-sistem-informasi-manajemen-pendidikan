const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "SIM Pendidikan POS PAUD Melati Azzahra API",
    version: "1.0.0",
    description: "Dokumentasi API untuk autentikasi, data siswa, rapor, dokumen, template rapor, pertanyaan, APE, anekdot, pencarian, ringkasan, dan laporan siswa.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Autentikasi JWT" },
    { name: "Users", description: "Manajemen user" },
    { name: "Students", description: "Manajemen data siswa" },
    { name: "Reports", description: "Rapor siswa" },
    { name: "Documents", description: "Dokumen akreditasi" },
    { name: "Anecdotes", description: "Anekdot / catatan harian" },
    { name: "Questions", description: "Bank soal" },
    { name: "APE", description: "Alat peraga edukatif" },
    { name: "Logs", description: "Log aktivitas" },
    { name: "Search", description: "Pencarian gabungan" },
    { name: "Summary", description: "Ringkasan statistik" },
    { name: "Templates", description: "Template rapor" },
    { name: "Student Reports", description: "Input dan kelola hasil rapor siswa" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          status: { type: "integer", example: 200 },
          message: { type: "string", example: "Berhasil" },
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "guru1@local.test" },
          password: { type: "string", example: "guru12345" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 3 },
              name: { type: "string", example: "Guru 1" },
              email: { type: "string", example: "guru1@local.test" },
              role: { type: "string", example: "GURU" },
            },
          },
        },
      },
      StudentCreateRequest: {
        type: "object",
        required: ["name", "identifier"],
        properties: {
          name: { type: "string", example: "Alya Putri" },
          identifier: { type: "string", example: "STU-001" },
          nisn: { type: "string", example: "1234567890" },
          className: { type: "string", example: "A1" },
          tahunAjaran: { type: "string", example: "2025/2026" },
          parentName: { type: "string", example: "Budi" },
          parentPhone: { type: "string", example: "081234567890" },
          address: { type: "string", example: "Jl. Melati No. 10" },
          photo: { type: "string", format: "binary" },
        },
      },
      StudentItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Alya Putri" },
          identifier: { type: "string", example: "STU-001" },
          nisn: { type: "string", nullable: true, example: "1234567890" },
          className: { type: "string", nullable: true, example: "A1" },
          tahunAjaran: { type: "string", nullable: true, example: "2025/2026" },
          photoUrl: { type: "string", nullable: true, example: "/uploads/images/student-1.jpg" },
        },
      },
      UserItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Admin" },
          email: { type: "string", example: "admin@local.test" },
          role: { type: "string", example: "ADMIN" },
        },
      },
      DocumentCreateRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Laporan Akreditasi 2026" },
          category: { type: "string", example: "Akreditasi" },
          documentDate: { type: "string", example: "2026-04-30" },
          filePath: { type: "string", example: "/uploads/documents/laporan-akreditasi.pdf" },
          file: { type: "string", format: "binary" },
        },
      },
      ReportCreateRequest: {
        type: "object",
        required: ["studentId", "title"],
        properties: {
          studentId: { type: "integer", example: 1 },
          title: { type: "string", example: "Perkembangan Bulanan April" },
          description: { type: "string", example: "Anak aktif mengikuti kegiatan kelas." },
          date: { type: "string", example: "2026-04-30" },
          photo: { type: "string", format: "binary" },
        },
      },
      AnecdoteCreateRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", example: "Alya membantu teman saat bermain." },
          description: { type: "string", example: "Catatan interaksi sosial." },
          category: { type: "string", example: "Sosial" },
          date: { type: "string", example: "2026-04-30" },
          image: { type: "string", format: "binary" },
        },
      },
      ApeCreateRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Puzzle Huruf" },
          condition: { type: "string", example: "Baik" },
          quantity: { type: "integer", example: 12 },
          location: { type: "string", example: "Ruang kelas A" },
          imageUrl: { type: "string", example: "/uploads/images/puzzle.jpg" },
          image: { type: "string", format: "binary" },
        },
      },
      QuestionCreateRequest: {
        type: "object",
        properties: {
          section: { type: "string", example: "Section 1" },
          text: { type: "string", example: "Anak mampu mengenal huruf A-Z" },
          imageUrl: { type: "string", example: "/uploads/images/soal-1.jpg" },
          image: { type: "string", format: "binary" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string", example: "Anak mampu menyebut warna dasar" },
                imageUrl: { type: "string", example: "/uploads/images/soal-opsi.jpg" },
              },
            },
          },
        },
      },
      TemplateCreateRequest: {
        type: "object",
        required: ["title", "year", "data"],
        properties: {
          title: { type: "string", example: "Template Rapor 2025/2026" },
          year: { type: "integer", example: 2026 },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Section: { type: ["string", "number"], example: 1 },
                subtitle: { type: "string", example: "Aspek Bahasa" },
                type: { type: "string", example: "table" },
                Questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      Question: { type: "string", example: "Anak mengenal warna" },
                      answer: { type: "string", example: "" },
                      answers: {
                        type: "array",
                        items: { type: "string" },
                        example: ["Sangat Mampu", "Mampu", "Cukup Mampu", "Belum Mampu"],
                      },
                      photo: { type: ["string", "array"], example: "" },
                      photos: {
                        type: "array",
                        items: { type: "string" },
                        example: [],
                      },
                      Ket: { type: "string", example: "" },
                      predikat: { type: "string", example: "" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      StudentReportSubmitRequest: {
        type: "object",
        required: ["studentId", "templateId", "tahun_ajaran"],
        properties: {
          studentId: { type: "integer", example: 1 },
          templateId: { type: "integer", example: 2 },
          year: { type: "integer", example: 2026 },
          tahun_ajaran: { type: "string", example: "2025/2026" },
          semester: { type: "string", enum: ["ganjil", "genap"], example: "ganjil" },
          answers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionId: { type: "integer", example: 11 },
                answer: { type: "string", example: "Mampu" },
                photo: { type: ["string", "array"], example: "" },
                photos: {
                  type: "array",
                  items: { type: "string" },
                  example: [],
                },
                ket: { type: "string", example: "Aktif" },
                predikat: { type: "string", example: "A" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        description: "Public endpoint. Gunakan email & password untuk mendapat token JWT.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                email: "guru1@local.test",
                password: "guru12345",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login berhasil",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: { description: "Email atau password salah" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user",
        description: "Authenticated users. Hanya menghapus session/token di client; server mencatat aktivitas.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logout berhasil",
            content: {
              "application/json": {
                example: { status: 200, message: "Logout berhasil. Silakan hapus token di client.", success: true },
              },
            },
          },
        },
      },
    },
    "/api/users/options/teachers": {
      get: {
        tags: ["Users"],
        summary: "Daftar opsi guru",
        description: "Authenticated users (semua role). Mengembalikan list guru untuk dropdown/opsi pemilih.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  status: 200,
                  message: "Opsi guru berhasil diambil",
                  success: true,
                  data: [{ label: "Guru 1", value: 3 }],
                },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Daftar user",
        description: "Admin only: lihat daftar user. Role yang diperbolehkan: ADMIN.",
        security: [{ bearerAuth: [] }],
        responses: {
          responses: { 200: { description: "OK", content: { "application/json": { example: { status: 200, message: "Data rapor berhasil diambil", success: true, data: [{ id: 1, title: "Perkembangan Bulanan April", studentId: 1 }] } } } } },
          description: "OK",
          content: {
            "application/json": {
              example: {
                status: 200,
                message: "Data user berhasil diambil",
                responses: { 201: { description: "OK", content: { "application/json": { example: { status: 201, message: "Rapor berhasil dibuat", success: true, data: { id: 5, title: "Perkembangan Bulanan April", studentId: 1 } } } } } },
                data: { items: [{ id: 1, name: "Admin", email: "admin@local.test", role: "ADMIN" }], totalItems: 1, page: 1, pageSize: 5, totalPages: 1 },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Users"],
      summary: "Buat user baru",
      description: "Admin only: buat user baru. Role yang diperbolehkan: ADMIN.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password", "role"],
              properties: {
                name: { type: "string", example: "Guru Baru" },
                email: { type: "string", example: "guru.baru@local.test" },
                password: { type: "string", example: "password123" },
                role: { type: "string", enum: ["ADMIN", "KEPALA_SEKOLAH", "GURU"], example: "GURU" },
              },
            },
            example: {
              name: "Guru Baru",
              email: "guru.baru@local.test",
              password: "password123",
              role: "GURU",
            },
          },
        },
      },
      responses: {
        201: {
          description: "User dibuat",
          content: {
            "application/json": {
              example: {
                status: 201,
                message: "User berhasil dibuat",
                success: true,
                data: { id: 10, name: "Guru Baru", email: "guru.baru@local.test", role: "GURU" },
              },
            },
          },
        },
      },
    },
  },
  "/api/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Detail user",
      description: "Admin only: ambil detail user. Role yang diperbolehkan: ADMIN.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              example: { status: 200, message: "Data user berhasil diambil", success: true, data: { id: 1, name: "Admin", email: "admin@local.test", role: "ADMIN" } },
            },
          },
        },
        404: { description: "User tidak ditemukan" },
      },
    },
    put: {
      tags: ["Users"],
      summary: "Ubah user",
      description: "Admin only: ubah data user. Role yang diperbolehkan: ADMIN.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      requestBody: { required: true, content: { "application/json": { example: { name: "Admin Baru", role: "ADMIN" } } } },
      responses: {
        200: { content: { "application/json": { example: { status: 200, message: "User berhasil diperbarui", success: true, data: { id: 1, name: "Admin Baru", email: "admin@local.test", role: "ADMIN" } } } } },
        400: { description: "Validasi gagal atau permintaan tidak valid" },
      },
    },
    delete: {
      tags: ["Users"],
      summary: "Hapus user",
      description: "Admin only: hapus user. Role yang diperbolehkan: ADMIN.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 10 }],
      responses: {
        200: { content: { "application/json": { example: { status: 200, message: "User berhasil dihapus", success: true } } } },
        404: { description: "User tidak ditemukan" },
      },
    },
  },
  "/api/students/options": {
    get: {
      tags: ["Students"],
      summary: "Opsi siswa",
      description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — mengembalikan list singkat siswa untuk dropdown.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              example: { status: 200, message: "Opsi siswa berhasil diambil", success: true, data: [{ label: "Alya Putri", value: 1 }] },
            },
          },
        },
      },
    },
  },
  "/api/students": {
    get: {
      tags: ["Students"],
      summary: "Daftar siswa",
      description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — baca data siswa.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" }, example: "alya" }],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              example: { status: 200, message: "Data siswa berhasil diambil", success: true, data: { items: [{ id: 1, name: "Alya Putri", identifier: "STU-001" }], totalItems: 1, page: 1, pageSize: 5, totalPages: 1 } },
            },
          },
        },
      },
    },
    post: {
      tags: ["Students"],
      summary: "Buat siswa",
      description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — buat siswa baru (multipart/form-data).",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: { $ref: "#/components/schemas/StudentCreateRequest" },
            example: {
              name: "Alya Putri",
              identifier: "STU-001",
              nisn: "1234567890",
              className: "A1",
              tahunAjaran: "2025/2026",
              parentName: "Budi",
              parentPhone: "081234567890",
              address: "Jl. Melati No. 10",
            },
          },
        },
      },
      responses: { 201: { description: "OK", content: { "application/json": { example: { status: 201, message: "Siswa berhasil dibuat", success: true, data: { id: 2, name: "Alya Putri", identifier: "STU-001" } } } } } },
    },
  },
  "/api/students/{id}": {
    get: {
      tags: ["Students"],
      summary: "Detail siswa",
      description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — dapatkan detail siswa.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      responses: {
        200: {
          description: "OK",
          content: { "application/json": { example: { status: 200, message: "Data siswa berhasil diambil", success: true, data: { id: 1, name: "Alya Putri", identifier: "STU-001", className: "A1", tahunAjaran: "2025/2026" } } } },
        },
        404: { description: "Siswa tidak ditemukan" },
      },
    },
    put: {
      tags: ["Students"],
      summary: "Ubah siswa",
      description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — update data siswa (multipart/form-data).",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: { $ref: "#/components/schemas/StudentCreateRequest" },
            example: { name: "Alya Putri", className: "A2" },
          },
        },
      },
      responses: { 200: { description: "OK", content: { "application/json": { example: { status: 200, message: "Siswa berhasil diperbarui", success: true, data: { id: 1, name: "Alya Putri", className: "A2" } } } } } },
    },
    delete: {
      tags: ["Students"],
      summary: "Hapus siswa",
      description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — hapus siswa (akan menolak jika masih direferensi).",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      responses: { 200: { description: "OK", content: { "application/json": { example: { status: 200, message: "Siswa berhasil dihapus", success: true } } } }, 409: { description: "Siswa tidak bisa dihapus karena masih direferensi" } },
    },
  },
  "/api/reports": {
    get: {
      tags: ["Reports"],
      summary: "Daftar rapor",
      description: "Authenticated users — lihat rapor. Untuk create/update/delete: ADMIN, KEPALA_SEKOLAH, GURU.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "studentId", in: "query", required: false, schema: { type: "integer" }, example: 1 }],
      responses: { 200: { description: "OK" } },
    },
    post: {
      tags: ["Reports"],
      summary: "Buat rapor",
      description: "Create report: roles allowed ADMIN, KEPALA_SEKOLAH, GURU. (multipart/form-data)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: { $ref: "#/components/schemas/ReportCreateRequest" },
            example: {
              studentId: 1,
              title: "Perkembangan Bulanan April",
              description: "Anak aktif mengikuti kegiatan kelas.",
              date: "2026-04-30",
            },
          },
        },
      },
      responses: { 201: { description: "OK" } },
    },
  },
  "/api/reports/{id}": {
    get: {
      tags: ["Reports"],
      summary: "Detail rapor",
      description: "Authenticated users — detail rapor.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      responses: {
        200: { description: "OK", content: { "application/json": { example: { status: 200, message: "Data rapor berhasil diambil", success: true, data: { id: 1, title: "Perkembangan Bulanan April", studentId: 1 } } } } },
        404: { description: "Rapor tidak ditemukan" },
      },
    },
    put: {
      tags: ["Reports"],
      summary: "Ubah rapor",
      description: "Update report: roles allowed ADMIN, KEPALA_SEKOLAH, GURU. (multipart/form-data)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      requestBody: { required: true, content: { "multipart/form-data": { example: { title: "Perkembangan Bulanan April", description: "Revisi deskripsi" } } } },
      responses: { 200: { description: "OK" } },
    },
    delete: {
      tags: ["Reports"],
      summary: "Hapus rapor",
      description: "Delete report: roles allowed ADMIN, KEPALA_SEKOLAH, GURU.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      responses: { 200: { description: "OK" } },
    },
  },
  "/api/documents": {
    get: {
      tags: ["Documents"],
      summary: "Daftar dokumen",
      description: "Authenticated users — lihat dokumen. Create/update/delete hanya untuk ADMIN dan KEPALA_SEKOLAH.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" }, example: "akreditasi" }],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              example: { status: 200, message: "Data dokumen berhasil diambil", success: true, data: { items: [{ id: 1, title: "Laporan Mutu 2022", filePath: "/uploads/documents/laporan.pdf" }], totalItems: 1, page: 1 } },
            },
          },
        },
      },
      post: {
        tags: ["Documents"],
        summary: "Buat dokumen",
        description: "Create document: roles allowed ADMIN, KEPALA_SEKOLAH. (multipart/form-data)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/DocumentCreateRequest" },
              example: {
                title: "Laporan Akreditasi 2026",
                category: "Akreditasi",
                documentDate: "2026-04-30",
              },
            },
          },
        },
        responses: { 201: { description: "OK" } },
      },
    },
    "/api/documents/{id}": {
      get: {
        tags: ["Documents"],
        summary: "Detail dokumen",
        description: "Authenticated users — lihat detail dokumen.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  status: 200,
                  message: "Data dokumen berhasil diambil",
                  success: true,
                  data: {
                    id: 10,
                    title: "Laporan Akreditasi 2026",
                    filePath: "/uploads/documents/laporan-akreditasi.pdf",
                  },
                },
              },
            },
          },
          404: { description: "Dokumen tidak ditemukan" },
        },
      },
      put: {
        tags: ["Documents"],
        summary: "Ubah dokumen",
        description: "Update document: roles allowed ADMIN, KEPALA_SEKOLAH.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: { 200: { description: "OK" } },
      },
      delete: {
        tags: ["Documents"],
        summary: "Hapus dokumen",
        description: "Delete document: roles allowed ADMIN, KEPALA_SEKOLAH.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/documents/{id}/download": {
      get: { tags: ["Documents"], summary: "Unduh dokumen", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "File" } } },
    },
    "/api/documents/{id}/view": {
      get: {
        tags: ["Documents"],
        summary: "Lihat dokumen inline",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: { 200: { description: "File" } },
      },
    },
    "/api/anecdotes": {
      get: { tags: ["Anecdotes"], summary: "Daftar anekdot", description: "Authenticated users — list anekdot. Typically created by role GURU.", security: [{ bearerAuth: [] }], responses: { 200: { description: "OK" } } },
      post: {
        tags: ["Anecdotes"],
        summary: "Buat anekdot",
        description: "Intended for GURU: create anecdote. Authenticated users can call but typically GURU creates entries.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/AnecdoteCreateRequest" },
              example: { content: "Alya membantu teman saat bermain.", description: "Catatan interaksi sosial.", category: "Sosial", date: "2026-04-30" },
            },
          },
        },
        responses: { 201: { description: "OK" } },
      },
    },
    "/api/anecdotes/{id}": {
      get: { tags: ["Anecdotes"], summary: "Detail anekdot", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "OK" } } },
      put: { tags: ["Anecdotes"], summary: "Ubah anekdot", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "OK" } } },
      delete: { tags: ["Anecdotes"], summary: "Hapus anekdot", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "OK" } } },
    },
    "/api/questions": {
      get: {
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": { example: { status: 200, message: "Data dokumen berhasil diambil", success: true, data: { id: 1, title: "Laporan Mutu 2022", filePath: "/uploads/documents/laporan.pdf", documentDate: "2022-06-01" } } },
            },
          },
          404: { description: "Dokumen tidak ditemukan" },
        },
        summary: "Daftar section soal",
        description: "Authenticated users — lihat daftar section soal. Create/update/delete soal biasanya role GURU (atau Admin).",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" }, example: "huruf" }],
        responses: { 200: { description: "OK" } },
      },
      post: {
        responses: {
          200: { content: { "application/json": { example: { status: 200, message: "Dokumen berhasil diperbarui", success: true, data: { id: 1, title: "Laporan Mutu 2022" } } } } },
          404: { description: "Dokumen tidak ditemukan" },
        },
        summary: "Buat soal atau bulk soal",
        description: "Create/bulk-create questions: roles allowed ADMIN, KEPALA_SEKOLAH, GURU.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/QuestionCreateRequest" }, example: { section: "Section 1", text: "Anak mampu mengenal huruf A-Z", imageUrl: "/uploads/images/soal-1.jpg" } } },
        },
        responses: { 200: { content: { "application/json": { example: { status: 200, message: "Dokumen berhasil dihapus", success: true } } } }, 404: { description: "Dokumen tidak ditemukan" } },
      },
    },
    "/api/questions/sections": {
      get: { tags: ["Questions"], summary: "Daftar section soal", security: [{ bearerAuth: [] }], responses: { 200: { description: "OK" } } },
    },
    "/api/questions/sections/{id}": {
      get: {
        tags: ["Questions"],
        summary: "Detail section soal",
        description: "Authenticated users — lihat soal dalam satu section.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 61 }],
        responses: { 200: { description: "OK" } },
      },
      put: {
        tags: ["Questions"],
        summary: "Update section soal",
        description: "Update an entire section of questions: roles allowed ADMIN, KEPALA_SEKOLAH, GURU.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 61 }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/questions/{id}": {
      get: { tags: ["Questions"], summary: "Detail soal", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 11 }], responses: { 200: { description: "OK" } } },
      put: { tags: ["Questions"], summary: "Ubah soal", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 11 }], responses: { 200: { description: "OK" } } },
      delete: { tags: ["Questions"], summary: "Hapus soal", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 11 }], responses: { 200: { description: "OK" } } },
    },
    "/api/ape": {
      get: {
        tags: ["APE"],
        summary: "Daftar APE",
        description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — lihat APE.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" }, example: "puzzle" }],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["APE"],
        summary: "Buat APE",
        description: "Authenticated users (ADMIN, KEPALA_SEKOLAH, GURU) — create APE item.",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/ApeCreateRequest" }, example: { name: "Puzzle Huruf", condition: "Baik", quantity: 12, location: "Ruang kelas A" } } } },
        responses: { 201: { description: "OK" } },
      },
    },
    "/api/ape/{id}": {
      get: { tags: ["APE"], summary: "Detail APE", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "OK" } } },
      put: { tags: ["APE"], summary: "Ubah APE", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "OK" } } },
      delete: { tags: ["APE"], summary: "Hapus APE", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }], responses: { 200: { description: "OK" } } },
    },
    "/api/logs": {
      get: { tags: ["Logs"], summary: "Log aktivitas", description: "Admin only: lihat log aktivitas (maks 200). Role: ADMIN.", security: [{ bearerAuth: [] }], responses: { 200: { description: "OK" } } },
    },
    "/api/search": {
      get: {
        tags: ["Search"],
        summary: "Pencarian gabungan",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" }, example: "alya" }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/summary": {
      get: {
        tags: ["Summary"],
        summary: "Ringkasan statistik",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/rapor/templates/active": {
      get: { tags: ["Templates"], summary: "Template rapor aktif", security: [{ bearerAuth: [] }], responses: { 200: { description: "OK" } } },
    },
    "/api/rapor/templates": {
      post: {
        tags: ["Templates"],
        summary: "Buat template rapor",
        description: "Create template rapor: roles allowed ADMIN, KEPALA_SEKOLAH.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TemplateCreateRequest" },
              example: { title: "Template Rapor 2025/2026", year: 2026, data: [{ Section: 1, type: "table", Questions: [{ Question: "Anak mengenal warna", answers: ["Sangat Mampu", "Mampu", "Cukup Mampu", "Belum Mampu"] }] }] },
            },
          },
        },
        responses: { 201: { description: "OK" } },
      },
    },
    "/api/rapor/templates/{id}/activate": {
      patch: {
        tags: ["Templates"],
        summary: "Aktifkan template",
        description: "Aktifkan template rapor: roles allowed ADMIN, KEPALA_SEKOLAH.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 2 }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/reports/student-reports": {
      get: {
        tags: ["Student Reports"],
        summary: "Daftar laporan siswa",
        description: "Authenticated users — lihat laporan siswa. Create/update/delete biasanya dilakukan oleh Guru/penilai (ADMIN/Kepsek/GURU).",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "studentId", in: "query", required: false, schema: { type: "integer" }, example: 1 },
          { name: "templateId", in: "query", required: false, schema: { type: "integer" }, example: 2 },
          { name: "tahun_ajaran", in: "query", required: false, schema: { type: "string" }, example: "2025/2026" },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Student Reports"],
        summary: "Simpan laporan siswa",
        description: "Submit laporan siswa: roles allowed ADMIN, KEPALA_SEKOLAH, GURU. Terima format `answers[]` atau `data/Questions` (multipart).",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/StudentReportSubmitRequest" },
              example: { studentId: 1, templateId: 2, year: 2026, tahun_ajaran: "2025/2026", semester: "ganjil", answers: [{ questionId: 11, answer: "Mampu", ket: "Aktif", predikat: "A" }] },
            },
          },
        },
        responses: { 201: { description: "OK" } },
      },
    },
    "/api/reports/student-reports/{id}": {
      get: {
        tags: ["Student Reports"],
        summary: "Detail laporan siswa",
        description: "Authenticated users — lihat detail laporan siswa.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: { 200: { description: "OK" } },
      },
      put: {
        tags: ["Student Reports"],
        summary: "Ubah laporan siswa",
        description: "Update laporan siswa: roles allowed ADMIN, KEPALA_SEKOLAH, GURU. Terima format `answers[]` atau `data/Questions`.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: { 200: { description: "OK" } },
      },
      delete: {
        tags: ["Student Reports"],
        summary: "Hapus laporan siswa",
        description: "Delete laporan siswa: roles allowed ADMIN, KEPALA_SEKOLAH, GURU.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

module.exports = { swaggerSpec };

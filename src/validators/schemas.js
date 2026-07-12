const { z } = require("zod");

// ENUMS untuk UI
const roleEnum = z.enum(["ADMIN", "KEPALA_SEKOLAH", "GURU"]);
const sectionTypeEnum = z.enum(["table_text", "table_option", "table", "text"]);
const questionTypeEnum = z.enum(["QUESTION", "FREE_TEXT", "PHOTO"]);
const dateOnlyOrDateTimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/, "Format tanggal harus YYYY-MM-DD atau ISO datetime");
const photoInputSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .nullable();

// AUTH
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: roleEnum,
});

// USERS
const userCreateSchema = registerSchema;
const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email("Email tidak valid").optional(),
  password: z.string().min(6).optional(),
  role: roleEnum.optional(),
});

// STUDENTS
const studentCreateSchema = z.object({
  name: z.string().min(1),
  identifier: z.string().min(1),
  nisn: z.string().optional().nullable(),
  className: z.string().optional().nullable(),
  tahunAjaran: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});
const studentUpdateSchema = studentCreateSchema.partial();

// DOCUMENTS
const documentCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional().nullable(),
  filePath: z.string().min(1).optional(),
  documentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
const documentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  filePath: z.string().min(1).optional(),
  documentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// ANECDOTES
const anecdoteCreateSchema = z.object({
  content: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  date: dateOnlyOrDateTimeSchema.optional(),
});
const anecdoteUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  date: dateOnlyOrDateTimeSchema.optional(),
});

// QUESTIONS generic
const questionCreateSchema = z
  .object({
    section: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    imageUrl: z.string().min(1).optional().nullable(),
    questions: z
      .array(
        z.object({
          text: z.string().min(1),
          imageUrl: z.string().min(1).optional().nullable(),
        }),
      )
      .min(1)
      .optional(),
  })
  .superRefine((payload, ctx) => {
    const hasSingle = typeof payload.text === "string" && payload.text.trim().length > 0;
    const hasBulk = Array.isArray(payload.questions) && payload.questions.length > 0;

    if (!hasSingle && !hasBulk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["text"],
        message: "Wajib kirim text atau questions[]",
      });
    }
  });
const questionUpdateSchema = z.object({
  text: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional().nullable(),
});

const questionSectionUpdateSchema = z.object({
  section: z.string().min(1).optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        imageUrl: z.string().min(1).optional().nullable(),
      }),
    )
    .min(1),
});

// APE
const apeCreateSchema = z.object({
  name: z.string().min(1),
  condition: z.string().optional().nullable(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});
const apeUpdateSchema = apeCreateSchema.partial();

// Pagination & search
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(5),
});
const searchQuerySchema = z.object({
  q: z.string().optional().default(""),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(5),
});

// TEMPLATE (UI format sesuai request)
const templateQuestionSchema = z.object({
  Question: z.string().min(1),
  answer: z.string().optional().default(""),
  answers: z.array(z.string()).optional().default([]),
  photo: photoInputSchema,
  photos: z.array(z.string()).optional(),
  Ket: z.string().optional().nullable(),
});
const templateSectionSchema = z.object({
  Section: z.union([z.string(), z.number()]),
  subtitle: z.string().optional().nullable(),
  type: sectionTypeEnum,

  // UI sering mengirim headers predikat untuk kolom tabel
  // Bisa berupa string (CSV) atau array string
  Headers: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  // alias (jika front-end mengirim lowercase)
  headers: z.union([z.string(), z.array(z.string())]).optional().nullable(),

  Questions: z.array(templateQuestionSchema).min(1),
});
const templateCreateSchema = z.object({
  title: z.string().min(1),
  year: z.coerce.number().int(),
  data: z.array(templateSectionSchema).min(1),
});

// STUDENT REPORT submit
const studentReportAnswerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  answer: z.string().optional().nullable(),
  photo: photoInputSchema,
  photos: z.array(z.string()).optional(),
  ket: z.string().optional().nullable(),
});

const studentReportUiQuestionSchema = z.object({
  Question: z.string().min(1),
  answer: z.string().optional().nullable(),
  photo: photoInputSchema,
  photos: z.array(z.string()).optional(),
  Ket: z.string().optional().nullable(),
  predikat: z.string().optional().nullable(),
});

const studentReportUiSectionSchema = z.object({
  Section: z.union([z.string(), z.number()]).optional(),
  subtitle: z.string().optional().nullable(),
  type: sectionTypeEnum.optional(),
  Questions: z.array(studentReportUiQuestionSchema).min(1),
});

const studentReportSubmitSchema = z
  .object({
    studentId: z.coerce.number().int().positive(),
    templateId: z.coerce.number().int().positive(),
    year: z.coerce.number().int().positive().optional(),
    tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, "Format tahun_ajaran harus YYYY/YYYY"),
    semester: z
      .preprocess(
        (v) => {
          if (v === undefined || v === null || v === "") return "ganjil";
          if (typeof v === "number") return v === 2 ? "genap" : "ganjil";
          if (typeof v === "string") {
            const normalized = v.trim().toLowerCase();
            if (normalized === "1") return "ganjil";
            if (normalized === "2") return "genap";
            return normalized;
          }
          return v;
        },
        z.enum(["ganjil", "genap"]),
      )
      .default("ganjil"),
    answers: z.array(studentReportAnswerSchema).min(1).optional(),
    data: z.array(studentReportUiSectionSchema).min(1).optional(),
  })
  .superRefine((payload, ctx) => {
    const hasAnswers = Array.isArray(payload.answers) && payload.answers.length > 0;
    const hasData = Array.isArray(payload.data) && payload.data.length > 0;
    if (!hasAnswers && !hasData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers"],
        message: "Wajib kirim answers[] atau data[].Questions[]",
      });
    }
  });

// REPORTS
const reportCreateSchema = z.object({
  studentId: z.coerce.number().int().positive("ID Siswa wajib valid"),
  title: z.string().min(1, "Judul laporan wajib diisi"),
  description: z.string().optional().nullable(),
  photoUrl: photoInputSchema,
  date: dateOnlyOrDateTimeSchema.optional(),
});
const reportUpdateSchema = reportCreateSchema.partial();

// SUMMARY
const summaryQuerySchema = z.object({
  q: z.string().optional(),
}).optional();

module.exports = {
  loginSchema,
  registerSchema,
  userCreateSchema,
  userUpdateSchema,
  studentCreateSchema,
  studentUpdateSchema,
  documentCreateSchema,
  documentUpdateSchema,
  anecdoteCreateSchema,
  anecdoteUpdateSchema,
  questionCreateSchema,
  questionUpdateSchema,
  questionSectionUpdateSchema,
  apeCreateSchema,
  apeUpdateSchema,
  paginationQuerySchema,
  searchQuerySchema,
  templateCreateSchema,
  studentReportSubmitSchema,
  sectionTypeEnum,
  questionTypeEnum,
  reportCreateSchema,
  reportUpdateSchema,
  summaryQuerySchema,
};


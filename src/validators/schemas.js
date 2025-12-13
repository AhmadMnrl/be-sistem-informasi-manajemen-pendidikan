const { z } = require('zod');

// ENUMS untuk UI
const roleEnum = z.enum(['ADMIN', 'KEPALA_SEKOLAH', 'GURU']);
const sectionTypeEnum = z.enum(['table_text', 'table_option', 'table', 'text']);
const questionTypeEnum = z.enum(['QUESTION', 'FREE_TEXT', 'PHOTO']);

// AUTH
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: roleEnum,
});

// USERS
const userCreateSchema = registerSchema;
const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('Email tidak valid').optional(),
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
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
const documentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ANECDOTES
const anecdoteCreateSchema = z.object({
  content: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});
const anecdoteUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});

// QUESTIONS generic
const questionCreateSchema = z.object({ text: z.string().min(1) });
const questionUpdateSchema = z.object({ text: z.string().min(1).optional() });

// APE
const apeCreateSchema = z.object({
  name: z.string().min(1),
  condition: z.string().optional().nullable(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  location: z.string().optional().nullable(),
});
const apeUpdateSchema = apeCreateSchema.partial();

// Pagination & search
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(5),
});
const searchQuerySchema = z.object({
  q: z.string().optional().default(''),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(5),
});

// TEMPLATE (UI format sesuai request)
const templateQuestionSchema = z.object({
  Question: z.string().min(1),
  answer: z.string().optional().default(''),
  answers: z.array(z.string()).optional().default([]),
  photo: z.string().optional().default(''),
  Ket: z.string().optional().nullable(),
});
const templateSectionSchema = z.object({
  Section: z.union([z.string(), z.number()]),
  type: sectionTypeEnum,
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
  photo: z.string().optional().nullable(),
  ket: z.string().optional().nullable(),
});
const studentReportSubmitSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  templateId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().positive(),
  answers: z.array(studentReportAnswerSchema).min(1),
});

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
  apeCreateSchema,
  apeUpdateSchema,
  paginationQuerySchema,
  searchQuerySchema,
  templateCreateSchema,
  studentReportSubmitSchema,
  sectionTypeEnum,
  questionTypeEnum,
};

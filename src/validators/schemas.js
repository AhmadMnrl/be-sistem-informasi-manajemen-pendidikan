const { z } = require('zod');

// Auth
const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});
const registerSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.enum(['ADMIN', 'KEPALA_SEKOLAH', 'GURU']),
});

// Users
const userCreateSchema = registerSchema;
const userUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	password: z.string().min(6).optional(),
	role: z.enum(['ADMIN', 'KEPALA_SEKOLAH', 'GURU']).optional(),
});

// Students
const studentCreateSchema = z.object({
	name: z.string().min(1),
	identifier: z.string().optional().nullable(),
	className: z.string().optional().nullable(),
	parentName: z.string().optional().nullable(),
	parentPhone: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
});
const studentUpdateSchema = studentCreateSchema.partial();

// Reports
const reportCreateSchema = z.object({
	studentId: z.coerce.number().int().positive(),
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	date: z.string().datetime().optional(),
});
const reportUpdateSchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	date: z.string().datetime().optional(),
});

// Documents
const documentCreateSchema = z.object({
	title: z.string().min(1),
	category: z.string().optional().nullable(),
});
const documentUpdateSchema = z.object({
	title: z.string().min(1).optional(),
	category: z.string().optional().nullable(),
});

// Anecdotes
const anecdoteCreateSchema = z.object({
	content: z.string().min(1),
	date: z.string().datetime().optional(),
	studentId: z.coerce.number().int().positive().optional(),
});
const anecdoteUpdateSchema = z.object({
	content: z.string().min(1).optional(),
	date: z.string().datetime().optional(),
	studentId: z.coerce.number().int().positive().optional().nullable(),
});

// Questions
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

// Search & Summary
const searchQuerySchema = z.object({
	q: z.string().optional().default(''),
	page: z.string().optional(),
	pageSize: z.string().optional(),
});
const summaryQuerySchema = z.object({
	period: z.enum(['day', 'month', 'year']).optional(),
	from: z.string().optional(),
	to: z.string().optional(),
});

module.exports = {
	loginSchema,
	registerSchema,
	userCreateSchema,
	userUpdateSchema,
	studentCreateSchema,
	studentUpdateSchema,
	reportCreateSchema,
	reportUpdateSchema,
	documentCreateSchema,
	documentUpdateSchema,
	anecdoteCreateSchema,
	anecdoteUpdateSchema,
	questionCreateSchema,
	questionUpdateSchema,
	apeCreateSchema: apeCreateSchema,
	apeUpdateSchema: apeUpdateSchema,
	searchQuerySchema,
	summaryQuerySchema,
};

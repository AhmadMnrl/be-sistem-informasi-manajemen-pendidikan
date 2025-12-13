const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');
const { sendResponse } = require('../utils/response');

async function listQuestions(req, res) {
	const q = req.query.q || '';
	const where = q ? { text: { contains: q, mode: 'insensitive' } } : undefined;
	const items = await prisma.question.findMany({ where, orderBy: { id: 'desc' } });
	return sendResponse(res, 200, 'Data soal berhasil diambil', items);
}

async function createQuestion(req, res) {
	const { text } = req.body || {};
	if (!text) return sendResponse(res, 400, 'Text wajib diisi');
	const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;
	const teacherId = req.user.id;
	try {
		const created = await prisma.question.create({ data: { text, imageUrl, teacherId } });
		await logActivity({ userId: req.user.id, action: 'CREATE_QUESTION', entity: 'Question', entityId: created.id });
		return sendResponse(res, 201, 'Soal berhasil dibuat', created);
	} catch (e) {
		return sendResponse(res, 500, 'Gagal membuat soal');
	}
}

async function getQuestion(req, res) {
	const id = Number(req.params.id);
	const item = await prisma.question.findUnique({ where: { id } });
	if (!item) return sendResponse(res, 404, 'Soal tidak ditemukan');
	return sendResponse(res, 200, 'Data soal berhasil diambil', item);
}

async function updateQuestion(req, res) {
	const id = Number(req.params.id);
	const { text } = req.body || {};
	const data = {};
	if (text !== undefined) data.text = text;
	if (req.file) data.imageUrl = `/uploads/images/${req.file.filename}`;
	try {
		const updated = await prisma.question.update({ where: { id }, data });
		await logActivity({ userId: req.user.id, action: 'UPDATE_QUESTION', entity: 'Question', entityId: updated.id });
		return sendResponse(res, 200, 'Soal berhasil diperbarui', updated);
	} catch (e) {
		return sendResponse(res, 404, 'Soal tidak ditemukan');
	}
}

async function deleteQuestion(req, res) {
	const id = Number(req.params.id);
	try {
		await prisma.question.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_QUESTION', entity: 'Question', entityId: id });
		return sendResponse(res, 200, 'Soal berhasil dihapus');
	} catch (e) {
		return sendResponse(res, 404, 'Soal tidak ditemukan');
	}
}

module.exports = { listQuestions, createQuestion, getQuestion, updateQuestion, deleteQuestion };

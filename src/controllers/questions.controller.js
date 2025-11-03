const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function listQuestions(req, res) {
	const q = req.query.q || '';
	const where = q ? { text: { contains: q, mode: 'insensitive' } } : undefined;
	const items = await prisma.question.findMany({ where, orderBy: { id: 'desc' } });
	return res.json(items);
}

async function createQuestion(req, res) {
	const { text } = req.body || {};
	if (!text) return res.status(400).json({ message: 'text wajib' });
	const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;
	const teacherId = req.user.id;
	const created = await prisma.question.create({ data: { text, imageUrl, teacherId } });
	await logActivity({ userId: req.user.id, action: 'CREATE_QUESTION', entity: 'Question', entityId: created.id });
	return res.status(201).json(created);
}

async function getQuestion(req, res) {
	const id = Number(req.params.id);
	const item = await prisma.question.findUnique({ where: { id } });
	if (!item) return res.status(404).json({ message: 'Soal tidak ditemukan' });
	return res.json(item);
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
		return res.json(updated);
	} catch (e) {
		return res.status(404).json({ message: 'Soal tidak ditemukan' });
	}
}

async function deleteQuestion(req, res) {
	const id = Number(req.params.id);
	try {
		await prisma.question.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_QUESTION', entity: 'Question', entityId: id });
		return res.json({ success: true });
	} catch (e) {
		return res.status(404).json({ message: 'Soal tidak ditemukan' });
	}
}

module.exports = { listQuestions, createQuestion, getQuestion, updateQuestion, deleteQuestion };

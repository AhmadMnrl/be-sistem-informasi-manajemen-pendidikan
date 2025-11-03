const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function listAnecdotes(req, res) {
	const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
	const where = studentId ? { studentId } : undefined;
	const anecdotes = await prisma.anecdote.findMany({ where, orderBy: { id: 'desc' } });
	return res.json(anecdotes);
}

async function createAnecdote(req, res) {
	const { content, date, studentId } = req.body || {};
	if (!content) return res.status(400).json({ message: 'content wajib' });
	const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;
	const teacherId = req.user.id;
	const created = await prisma.anecdote.create({ data: { content, date: date ? new Date(date) : undefined, imageUrl, teacherId, studentId: studentId ? Number(studentId) : null } });
	await logActivity({ userId: req.user.id, action: 'CREATE_ANECDOTE', entity: 'Anecdote', entityId: created.id });
	return res.status(201).json(created);
}

async function getAnecdote(req, res) {
	const id = Number(req.params.id);
	const item = await prisma.anecdote.findUnique({ where: { id } });
	if (!item) return res.status(404).json({ message: 'Anekdot tidak ditemukan' });
	return res.json(item);
}

async function updateAnecdote(req, res) {
	const id = Number(req.params.id);
	const { content, date, studentId } = req.body || {};
	const data = {};
	if (content !== undefined) data.content = content;
	if (date) data.date = new Date(date);
	if (studentId !== undefined) data.studentId = studentId ? Number(studentId) : null;
	if (req.file) data.imageUrl = `/uploads/images/${req.file.filename}`;
	try {
		const updated = await prisma.anecdote.update({ where: { id }, data });
		await logActivity({ userId: req.user.id, action: 'UPDATE_ANECDOTE', entity: 'Anecdote', entityId: updated.id });
		return res.json(updated);
	} catch (e) {
		return res.status(404).json({ message: 'Anekdot tidak ditemukan' });
	}
}

async function deleteAnecdote(req, res) {
	const id = Number(req.params.id);
	try {
		await prisma.anecdote.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_ANECDOTE', entity: 'Anecdote', entityId: id });
		return res.json({ success: true });
	} catch (e) {
		return res.status(404).json({ message: 'Anekdot tidak ditemukan' });
	}
}

module.exports = { listAnecdotes, createAnecdote, getAnecdote, updateAnecdote, deleteAnecdote };

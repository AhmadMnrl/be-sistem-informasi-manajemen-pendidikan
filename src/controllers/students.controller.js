const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function listStudents(req, res) {
	const q = req.query.q || '';
	const students = await prisma.student.findMany({ where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined, orderBy: { id: 'desc' } });
	return res.json(students);
}

async function createStudent(req, res) {
	const { name, identifier, className, parentName, parentPhone, address } = req.body || {};
	if (!name) return res.status(400).json({ message: 'name wajib' });
	const photoUrl = req.file ? `/uploads/images/${req.file.filename}` : null;
	try {
		const created = await prisma.student.create({ data: { name, identifier: identifier || null, className: className || null, parentName: parentName || null, parentPhone: parentPhone || null, address: address || null, photoUrl } });
		await logActivity({ userId: req.user.id, action: 'CREATE_STUDENT', entity: 'Student', entityId: created.id });
		return res.status(201).json(created);
	} catch (e) {
		return res.status(400).json({ message: 'Gagal membuat siswa', error: e?.message });
	}
}

async function getStudent(req, res) {
	const id = Number(req.params.id);
	const student = await prisma.student.findUnique({ where: { id } });
	if (!student) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
	return res.json(student);
}

async function updateStudent(req, res) {
	const id = Number(req.params.id);
	const { name, identifier, className, parentName, parentPhone, address } = req.body || {};
	const data = {};
	if (name) data.name = name;
	if (identifier !== undefined) data.identifier = identifier || null;
	if (className !== undefined) data.className = className || null;
	if (parentName !== undefined) data.parentName = parentName || null;
	if (parentPhone !== undefined) data.parentPhone = parentPhone || null;
	if (address !== undefined) data.address = address || null;
	if (req.file) data.photoUrl = `/uploads/images/${req.file.filename}`;
	try {
		const updated = await prisma.student.update({ where: { id }, data });
		await logActivity({ userId: req.user.id, action: 'UPDATE_STUDENT', entity: 'Student', entityId: updated.id });
		return res.json(updated);
	} catch (e) {
		return res.status(404).json({ message: 'Siswa tidak ditemukan' });
	}
}

async function deleteStudent(req, res) {
	const id = Number(req.params.id);
	try {
		await prisma.student.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_STUDENT', entity: 'Student', entityId: id });
		return res.json({ success: true });
	} catch (e) {
		return res.status(404).json({ message: 'Siswa tidak ditemukan' });
	}
}

module.exports = { listStudents, createStudent, getStudent, updateStudent, deleteStudent };

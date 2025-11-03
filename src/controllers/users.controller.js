const bcrypt = require('bcryptjs');
const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function listUsers(req, res) {
	const users = await prisma.user.findMany({ orderBy: { id: 'desc' }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
	return res.json(users);
}

async function createUser(req, res) {
	const { name, email, password, role } = req.body || {};
	if (!name || !email || !password || !role) return res.status(400).json({ message: 'name, email, password, role wajib' });
	if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU'].includes(role)) return res.status(400).json({ message: 'role tidak valid' });
	const exist = await prisma.user.findUnique({ where: { email } });
	if (exist) return res.status(409).json({ message: 'Email sudah terdaftar' });
	const passwordHash = await bcrypt.hash(password, 10);
	const created = await prisma.user.create({ data: { name, email, passwordHash, role } });
	await logActivity({ userId: req.user.id, action: 'CREATE_USER', entity: 'User', entityId: created.id });
	return res.status(201).json({ id: created.id, name: created.name, email: created.email, role: created.role });
}

async function getUser(req, res) {
	const id = Number(req.params.id);
	const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
	if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
	return res.json(user);
}

async function updateUser(req, res) {
	const id = Number(req.params.id);
	const { name, email, password, role } = req.body || {};
	const data = {};
	if (name) data.name = name;
	if (email) data.email = email;
	if (role) {
		if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU'].includes(role)) return res.status(400).json({ message: 'role tidak valid' });
		data.role = role;
	}
	if (password) data.passwordHash = await bcrypt.hash(password, 10);
	try {
		const updated = await prisma.user.update({ where: { id }, data });
		await logActivity({ userId: req.user.id, action: 'UPDATE_USER', entity: 'User', entityId: updated.id });
		return res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
	} catch (e) {
		return res.status(404).json({ message: 'User tidak ditemukan' });
	}
}

async function deleteUser(req, res) {
	const id = Number(req.params.id);
	try {
		const deleted = await prisma.user.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_USER', entity: 'User', entityId: deleted.id });
		return res.json({ success: true });
	} catch (e) {
		return res.status(404).json({ message: 'User tidak ditemukan' });
	}
}

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function login(req, res) {
	const { email, password } = req.body || {};
	if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib' });
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.status(401).json({ message: 'Kredensial salah' });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(401).json({ message: 'Kredensial salah' });
	const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '12h' });
	await logActivity({ userId: user.id, action: 'LOGIN' });
	return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

async function register(req, res) {
	const { name, email, password, role } = req.body || {};
	if (!name || !email || !password || !role) return res.status(400).json({ message: 'name, email, password, role wajib' });
	if (!['ADMIN', 'KEPALA_SEKOLAH', 'GURU'].includes(role)) return res.status(400).json({ message: 'role tidak valid' });
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) return res.status(409).json({ message: 'Email sudah terdaftar' });
	const passwordHash = await bcrypt.hash(password, 10);
	const created = await prisma.user.create({ data: { name, email, passwordHash, role } });
	await logActivity({ userId: req.user.id, action: 'CREATE_USER', entity: 'User', entityId: created.id });
	return res.status(201).json({ id: created.id, name: created.name, email: created.email, role: created.role });
}

async function me(req, res) {
	const u = req.user;
	return res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
}

module.exports = { login, register, me };

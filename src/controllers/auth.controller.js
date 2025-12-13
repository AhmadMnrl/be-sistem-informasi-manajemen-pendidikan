const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');
const { sendResponse } = require('../utils/response');

async function login(req, res) {
	const { email, password } = req.body || {};
		if (!email || !password) return sendResponse(res, 400, 'Email dan password wajib');
	const user = await prisma.user.findUnique({ where: { email } });
		if (!user) return sendResponse(res, 401, 'Email tidak ditemukan');
	const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return sendResponse(res, 401, 'Password salah');
	const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '12h' });

	await logActivity({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id });

	return sendResponse(res, 200, 'Login berhasil', { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

module.exports = { login };
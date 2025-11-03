const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma');

async function authMiddleware(req, res, next) {
	const authHeader = req.headers['authorization'] || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return res.status(401).json({ message: 'Unauthorized' });

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
		const user = await prisma.user.findUnique({ where: { id: payload.userId } });
		if (!user) return res.status(401).json({ message: 'Invalid token' });
		req.user = user;
		return next();
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' });
	}
}

module.exports = { authMiddleware };

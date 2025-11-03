const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function listApe(req, res) {
	const q = req.query.q || '';
	const where = q ? { name: { contains: q, mode: 'insensitive' } } : undefined;
	const items = await prisma.ape.findMany({ where, orderBy: { id: 'desc' } });
	return res.json(items);
}

async function createApe(req, res) {
	const { name, condition, quantity, location } = req.body || {};
	if (!name) return res.status(400).json({ message: 'name wajib' });
	const created = await prisma.ape.create({ data: { name, condition: condition || null, quantity: quantity ? Number(quantity) : 0, location: location || null, updatedById: req.user.id } });
	await logActivity({ userId: req.user.id, action: 'CREATE_APE', entity: 'Ape', entityId: created.id });
	return res.status(201).json(created);
}

async function getApe(req, res) {
	const id = Number(req.params.id);
	const item = await prisma.ape.findUnique({ where: { id } });
	if (!item) return res.status(404).json({ message: 'APE tidak ditemukan' });
	return res.json(item);
}

async function updateApe(req, res) {
	const id = Number(req.params.id);
	const { name, condition, quantity, location } = req.body || {};
	const data = {};
	if (name !== undefined) data.name = name;
	if (condition !== undefined) data.condition = condition || null;
	if (quantity !== undefined) data.quantity = Number(quantity) || 0;
	if (location !== undefined) data.location = location || null;
	data.updatedById = req.user.id;
	try {
		const updated = await prisma.ape.update({ where: { id }, data });
		await logActivity({ userId: req.user.id, action: 'UPDATE_APE', entity: 'Ape', entityId: updated.id });
		return res.json(updated);
	} catch (e) {
		return res.status(404).json({ message: 'APE tidak ditemukan' });
	}
}

async function deleteApe(req, res) {
	const id = Number(req.params.id);
	try {
		await prisma.ape.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_APE', entity: 'Ape', entityId: id });
		return res.json({ success: true });
	} catch (e) {
		return res.status(404).json({ message: 'APE tidak ditemukan' });
	}
}

module.exports = { listApe, createApe, getApe, updateApe, deleteApe };

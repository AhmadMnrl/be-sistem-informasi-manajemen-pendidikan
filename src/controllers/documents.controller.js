const path = require('path');
const fs = require('fs');
const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');

async function listDocuments(req, res) {
	const q = req.query.q || '';
	const docs = await prisma.document.findMany({ where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined, orderBy: { id: 'desc' } });
	return res.json(docs);
}

async function createDocument(req, res) {
	const { title, category } = req.body || {};
	if (!title || !req.file) return res.status(400).json({ message: 'title dan file wajib' });
	const filePath = `/uploads/documents/${req.file.filename}`;
	const created = await prisma.document.create({ data: { title, category: category || null, filePath, uploadedById: req.user.id } });
	await logActivity({ userId: req.user.id, action: 'UPLOAD_DOCUMENT', entity: 'Document', entityId: created.id });
	return res.status(201).json(created);
}

async function getDocument(req, res) {
	const id = Number(req.params.id);
	const doc = await prisma.document.findUnique({ where: { id } });
	if (!doc) return res.status(404).json({ message: 'Dokumen tidak ditemukan' });
	return res.json(doc);
}

async function updateDocument(req, res) {
	const id = Number(req.params.id);
	const { title, category } = req.body || {};
	const data = {};
	if (title) data.title = title;
	if (category !== undefined) data.category = category || null;
	if (req.file) data.filePath = `/uploads/documents/${req.file.filename}`;
	try {
		const updated = await prisma.document.update({ where: { id }, data });
		await logActivity({ userId: req.user.id, action: 'UPDATE_DOCUMENT', entity: 'Document', entityId: updated.id });
		return res.json(updated);
	} catch (e) {
		return res.status(404).json({ message: 'Dokumen tidak ditemukan' });
	}
}

async function deleteDocument(req, res) {
	const id = Number(req.params.id);
	try {
		await prisma.document.delete({ where: { id } });
		await logActivity({ userId: req.user.id, action: 'DELETE_DOCUMENT', entity: 'Document', entityId: id });
		return res.json({ success: true });
	} catch (e) {
		return res.status(404).json({ message: 'Dokumen tidak ditemukan' });
	}
}

async function downloadDocument(req, res) {
	const id = Number(req.params.id);
	const doc = await prisma.document.findUnique({ where: { id } });
	if (!doc) return res.status(404).json({ message: 'Dokumen tidak ditemukan' });
	const absPath = path.join(process.cwd(), doc.filePath.replace(/^\//, ''));
	if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'File tidak ditemukan di server' });
	return res.download(absPath, path.basename(absPath));
}

module.exports = { listDocuments, createDocument, getDocument, updateDocument, deleteDocument, downloadDocument };

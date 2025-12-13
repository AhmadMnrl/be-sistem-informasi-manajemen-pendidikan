const { prisma } = require('../prisma');
const { logActivity } = require('../utils/activityLog');
const { sendResponse } = require('../utils/response');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');

async function listApe(req, res) {
    const { page = 1, pageSize = 5 } = req.query;
    const { page: p, pageSize: ps } = getPaginationParams(page, pageSize);
    const q = req.query.q || '';

    try {
        const where = q ? { name: { contains: q, mode: 'insensitive' } } : undefined;
        const totalItems = await prisma.ape.count({ where });
        const ape = await prisma.ape.findMany({
            where,
            orderBy: { id: 'desc' },
            skip: (p - 1) * ps,
            take: ps,
        });

        const response = buildPaginationResponse(ape, totalItems, p, ps);
        return sendResponse(res, 200, 'Data APE berhasil diambil', response);
    } catch (e) {
        return sendResponse(res, 500, 'Gagal mengambil data APE');
    }
}

async function createApe(req, res) {
    const { name, condition, quantity, location } = req.body || {};
    if (!name) return sendResponse(res, 400, 'Nama APE wajib');
    const photoUrl = req.file ? `/uploads/images/${req.file.filename}` : null;
    try {
        const created = await prisma.ape.create({
            data: {
                name,
                condition: condition || null,
                quantity: quantity || 0,
                location: location || null,
                photoUrl
            }
        });
        await logActivity({ userId: req.user.id, action: 'CREATE_APE', entity: 'APE', entityId: created.id });
        return sendResponse(res, 201, 'APE berhasil dibuat', created);
    } catch (e) {
        return sendResponse(res, 500, 'Gagal membuat APE');
    }
}

async function getApe(req, res) {
    const id = Number(req.params.id);
    try {
        const item = await prisma.ape.findUnique({ where: { id } });
        if (!item) return sendResponse(res, 404, 'APE tidak ditemukan');
        return sendResponse(res, 200, 'Data APE berhasil diambil', item);
    } catch (e) {
        return sendResponse(res, 404, 'APE tidak ditemukan');
    }
}

async function updateApe(req, res) {
    const id = Number(req.params.id);
    const { name, condition, quantity, location } = req.body || {};
    const data = {};
    if (name) data.name = name;
    if (condition !== undefined) data.condition = condition || null;
    if (quantity !== undefined) data.quantity = quantity;
    if (location !== undefined) data.location = location || null;
    if (req.file) data.photoUrl = `/uploads/images/${req.file.filename}`;
    try {
        const updated = await prisma.ape.update({ where: { id }, data });
        await logActivity({ userId: req.user.id, action: 'UPDATE_APE', entity: 'APE', entityId: updated.id });
        return sendResponse(res, 200, 'APE berhasil diperbarui', updated);
    } catch (e) {
        return sendResponse(res, 404, 'APE tidak ditemukan');
    }
}

async function deleteApe(req, res) {
    const id = Number(req.params.id);
    try {
        await prisma.ape.delete({ where: { id } });
        await logActivity({ userId: req.user.id, action: 'DELETE_APE', entity: 'APE', entityId: id });
        return sendResponse(res, 200, 'APE berhasil dihapus');
    } catch (e) {
        return sendResponse(res, 404, 'APE tidak ditemukan');
    }
}

module.exports = { listApe, createApe, getApe, updateApe, deleteApe };

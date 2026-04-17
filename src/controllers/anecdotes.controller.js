const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { buildImagePath } = require("../utils/filePath");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");

async function listAnecdotes(req, res) {
  const { page = 1, pageSize = 5 } = req.query;
  const { page: p, pageSize: ps } = getPaginationParams(page, pageSize);

  try {
    const totalItems = await prisma.anecdote.count();
    const anecdotes = await prisma.anecdote.findMany({
      orderBy: { id: "desc" },
      skip: (p - 1) * ps,
      take: ps,
    });

    const response = buildPaginationResponse(anecdotes, totalItems, p, ps);
    return sendResponse(res, 200, "Data anekdot berhasil diambil", response);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil data anekdot");
  }
}

async function createAnecdote(req, res) {
  const { content, description, category, date } = req.body || {};
  if (!content) return sendResponse(res, 400, "Content wajib");
  const imageUrl = req.file ? buildImagePath(req.file.filename) : null;
  const teacherId = req.user.id;
  try {
    const created = await prisma.anecdote.create({
      data: {
        content,
        description: description || null,
        category: category || null,
        date: date ? new Date(date) : new Date(),
        imageUrl,
        teacherId,
      },
    });
    await logActivity({ userId: req.user.id, action: "CREATE_ANECDOTE", entity: "Anecdote", entityId: created.id });
    return sendResponse(res, 201, "Anekdot berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat anekdot");
  }
}

async function getAnecdote(req, res) {
  const id = Number(req.params.id);
  try {
    const item = await prisma.anecdote.findUnique({ where: { id } });
    if (!item) return sendResponse(res, 404, "Anekdot tidak ditemukan");
    return sendResponse(res, 200, "Data anekdot berhasil diambil", item);
  } catch (e) {
    return sendResponse(res, 404, "Anekdot tidak ditemukan");
  }
}

async function updateAnecdote(req, res) {
  const id = Number(req.params.id);
  const { content, description, category, date } = req.body || {};
  const data = {};
  if (content !== undefined) data.content = content;
  if (description !== undefined) data.description = description || null;
  if (category !== undefined) data.category = category || null;
  if (date) data.date = new Date(date);
  if (req.file) data.imageUrl = buildImagePath(req.file.filename);
  try {
    const updated = await prisma.anecdote.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_ANECDOTE", entity: "Anecdote", entityId: updated.id });
    return sendResponse(res, 200, "Anekdot berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 404, "Anekdot tidak ditemukan");
  }
}

async function deleteAnecdote(req, res) {
  const id = Number(req.params.id);
  try {
    await prisma.anecdote.delete({ where: { id } });
    await logActivity({ userId: req.user.id, action: "DELETE_ANECDOTE", entity: "Anecdote", entityId: id });
    return sendResponse(res, 200, "Anekdot berhasil dihapus");
  } catch (e) {
    return sendResponse(res, 404, "Anekdot tidak ditemukan");
  }
}

module.exports = { listAnecdotes, createAnecdote, getAnecdote, updateAnecdote, deleteAnecdote };

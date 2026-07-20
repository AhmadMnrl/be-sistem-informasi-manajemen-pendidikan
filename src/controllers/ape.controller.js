const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");
const { buildImagePath, normalizeFilePath } = require("../utils/filePath");

async function listApe(req, res) {
  const { page = 1, pageSize = 5 } = req.query;
  const { page: p, pageSize: ps } = getPaginationParams(page, pageSize);

  const q = req.query.q || "";
  const name = req.query.name;
  const condition = req.query.condition;
  const quantityFrom = req.query.quantityFrom;
  const quantityTo = req.query.quantityTo;
  const location = req.query.location;

  try {
    const where = {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(name && String(name).trim() ? { name: { contains: String(name).trim(), mode: "insensitive" } } : {}),
      ...(condition && String(condition).trim() ? { condition: { equals: String(condition).trim() } } : {}),
      ...(location && String(location).trim() ? { location: { equals: String(location).trim() } } : {}),
      ...((quantityFrom || quantityTo) ? {
        quantity: {
          ...(quantityFrom !== undefined && quantityFrom !== "" ? { gte: Number(quantityFrom) } : {}),
          ...(quantityTo !== undefined && quantityTo !== "" ? { lte: Number(quantityTo) } : {}),
        },
      } : {}),
    };

    const whereFinal = Object.keys(where).length ? where : undefined;
    const totalItems = await prisma.ape.count({ where: whereFinal });
    const ape = await prisma.ape.findMany({
      where: whereFinal,
      orderBy: { id: "desc" },
      skip: (p - 1) * ps,
      take: ps,
    });

    const response = buildPaginationResponse(ape, totalItems, p, ps);
    return sendResponse(res, 200, "Data APE berhasil diambil", response);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil data APE");
  }
}

async function createApe(req, res) {
  const { name, condition, quantity, location, imageUrl: imageUrlFromBody } = req.body || {};
  if (!name) return sendResponse(res, 400, "Nama APE wajib");
  const imageUrl = req.file ? buildImagePath(req.file.filename) : normalizeFilePath(imageUrlFromBody);
  try {
    const created = await prisma.ape.create({
      data: {
        name,
        condition: condition || null,
        quantity: quantity || 0,
        location: location || null,
        imageUrl,
        createdBy: { connect: { id: req.user.id } },
        updatedBy: { connect: { id: req.user.id } },
      },
    });
    await logActivity({ userId: req.user.id, action: "CREATE_APE", entity: "APE", entityId: created.id });
    return sendResponse(res, 201, "APE berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat APE");
  }
}

async function getApe(req, res) {
  const id = Number(req.params.id);
  try {
    const item = await prisma.ape.findUnique({ where: { id } });
    if (!item) return sendResponse(res, 404, "APE tidak ditemukan");
    return sendResponse(res, 200, "Data APE berhasil diambil", item);
  } catch (e) {
    return sendResponse(res, 404, "APE tidak ditemukan");
  }
}

async function updateApe(req, res) {
  const id = Number(req.params.id);
  const { name, condition, quantity, location, imageUrl: imageUrlFromBody } = req.body || {};
  const data = {};
  if (name) data.name = name;
  if (condition !== undefined) data.condition = condition || null;
  if (quantity !== undefined) data.quantity = quantity;
  if (location !== undefined) data.location = location || null;
  if (req.file) data.imageUrl = buildImagePath(req.file.filename);
  else if (imageUrlFromBody !== undefined) data.imageUrl = normalizeFilePath(imageUrlFromBody);
  data.updatedBy = { connect: { id: req.user.id } };
  try {
    const updated = await prisma.ape.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_APE", entity: "APE", entityId: updated.id });
    return sendResponse(res, 200, "APE berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 404, "APE tidak ditemukan");
  }
}

async function deleteApe(req, res) {
  const id = Number(req.params.id);
  try {
    await prisma.ape.delete({ where: { id } });
    await logActivity({ userId: req.user.id, action: "DELETE_APE", entity: "APE", entityId: id });
    return sendResponse(res, 200, "APE berhasil dihapus");
  } catch (e) {
    return sendResponse(res, 404, "APE tidak ditemukan");
  }
}

module.exports = { listApe, createApe, getApe, updateApe, deleteApe };

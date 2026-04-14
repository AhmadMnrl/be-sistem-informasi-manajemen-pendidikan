const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");

async function listReports(req, res) {
  const studentId = Number(req.query.studentId);
  const where = studentId ? { studentId } : undefined;
  const reports = await prisma.report.findMany({ where, orderBy: { id: "desc" } });
  return sendResponse(res, 200, "Data rapor berhasil diambil", reports);
}

async function createReport(req, res) {
  const { studentId, title, description, date } = req.body || {};
  if (!studentId || !title) return sendResponse(res, 400, "studentId dan title wajib");
  const photoUrl = req.file ? `/uploads/images/${req.file.filename}` : null;
  const teacherId = req.user.id;
  try {
    const created = await prisma.report.create({ data: { studentId: Number(studentId), title, description: description || null, photoUrl, date: date ? new Date(date) : undefined, teacherId } });
    await logActivity({ userId: req.user.id, action: "CREATE_REPORT", entity: "Report", entityId: created.id });
    return sendResponse(res, 201, "Rapor berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 400, "Gagal membuat rapor", { error: e?.message });
  }
}

async function getReport(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return sendResponse(res, 404, "Rapor tidak ditemukan");
  return sendResponse(res, 200, "Data rapor berhasil diambil", report);
}

async function updateReport(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  const { title, description, date } = req.body || {};
  const data = {};
  if (title) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (date) data.date = new Date(date);
  if (req.file) data.photoUrl = `/uploads/images/${req.file.filename}`;
  try {
    const updated = await prisma.report.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_REPORT", entity: "Report", entityId: updated.id });
    return sendResponse(res, 200, "Rapor berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 404, "Rapor tidak ditemukan");
  }
}

async function deleteReport(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  try {
    await prisma.report.delete({ where: { id } });
    await logActivity({ userId: req.user.id, action: "DELETE_REPORT", entity: "Report", entityId: id });
    return sendResponse(res, 200, "Rapor berhasil dihapus");
  } catch (e) {
    return sendResponse(res, 404, "Rapor tidak ditemukan");
  }
}

module.exports = { listReports, createReport, getReport, updateReport, deleteReport };

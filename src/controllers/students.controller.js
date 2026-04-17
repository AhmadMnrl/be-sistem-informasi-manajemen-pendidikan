const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");
const { buildImagePath } = require("../utils/filePath");

async function listStudents(req, res) {
  const { page = 1, pageSize = 5 } = req.query;
  const { page: p, pageSize: ps } = getPaginationParams(page, pageSize);
  const q = req.query.q || "";

  try {
    const where = q ? { name: { contains: q, mode: "insensitive" } } : undefined;
    const totalItems = await prisma.student.count({ where });
    const students = await prisma.student.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (p - 1) * ps,
      take: ps,
    });

    const response = buildPaginationResponse(students, totalItems, p, ps);
    return sendResponse(res, 200, "Data siswa berhasil diambil", response);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil data siswa");
  }
}

async function createStudent(req, res) {
  const { name, identifier, nisn, className, tahunAjaran, parentName, parentPhone, address } = req.body || {};
  if (!name) return sendResponse(res, 400, "Nama wajib");
  const photoUrl = req.file ? buildImagePath(req.file.filename) : null;
  try {
    const created = await prisma.student.create({
      data: {
        name,
        identifier,
        nisn: nisn || null,
        className: className || null,
        tahunAjaran: tahunAjaran || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        address: address || null,
        photoUrl,
      },
    });
    await logActivity({ userId: req.user.id, action: "CREATE_STUDENT", entity: "Student", entityId: created.id });
    return sendResponse(res, 201, "Siswa berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 400, "Gagal membuat siswa");
  }
}

async function getStudent(req, res) {
  const id = Number(req.params.id);
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return sendResponse(res, 404, "Siswa tidak ditemukan");
    return sendResponse(res, 200, "Data siswa berhasil diambil", student);
  } catch (e) {
    return sendResponse(res, 404, "Siswa tidak ditemukan");
  }
}

async function updateStudent(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  const { name, identifier, nisn, className, tahunAjaran, parentName, parentPhone, address } = req.body || {};
  const data = {};
  if (name) data.name = name;
  if (identifier !== undefined) data.identifier = identifier;
  if (nisn !== undefined) data.nisn = nisn || null;
  if (className !== undefined) data.className = className || null;
  if (tahunAjaran !== undefined) data.tahunAjaran = tahunAjaran || null;
  if (parentName !== undefined) data.parentName = parentName || null;
  if (parentPhone !== undefined) data.parentPhone = parentPhone || null;
  if (address !== undefined) data.address = address || null;
  if (req.file) data.photoUrl = buildImagePath(req.file.filename);
  try {
    const updated = await prisma.student.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_STUDENT", entity: "Student", entityId: updated.id });
    return sendResponse(res, 200, "Siswa berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 404, "Siswa tidak ditemukan");
  }
}

async function deleteStudent(req, res) {
  const id = Number(req.params.id);
  try {
    await prisma.student.delete({ where: { id } });
    await logActivity({ userId: req.user.id, action: "DELETE_STUDENT", entity: "Student", entityId: id });
    return sendResponse(res, 200, "Siswa berhasil dihapus");
  } catch (e) {
    return sendResponse(res, 404, "Siswa tidak ditemukan");
  }
}

async function getStudentsOptions(req, res) {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
    const options = students.map((s) => ({ label: s.name, value: s.id }));
    return sendResponse(res, 200, "Opsi siswa berhasil diambil", options);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil opsi siswa");
  }
}

module.exports = { listStudents, createStudent, getStudent, updateStudent, deleteStudent, getStudentsOptions };

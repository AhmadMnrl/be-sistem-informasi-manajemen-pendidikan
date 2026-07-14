const { prisma } = require("../prisma");
const { Prisma } = require("@prisma/client");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");
const { buildImagePath } = require("../utils/filePath");

function normalizeAliasFilters(query) {
  const className = query.className ?? query.kelas ?? undefined;
  const tahunAjaran = query.tahunAjaran ?? query.tahun_ajaran ?? undefined;

  return {
    q: query.q ?? "",
    className: className && String(className).trim() ? String(className).trim() : undefined,
    tahunAjaran:
      tahunAjaran && String(tahunAjaran).trim() ? String(tahunAjaran).trim() : undefined,
  };
}

async function listStudents(req, res) {
  const { page = 1, pageSize = 5 } = req.query;
  const { page: p, pageSize: ps } = getPaginationParams(page, pageSize);

  const { q, className, tahunAjaran } = normalizeAliasFilters(req.query || {});

  try {
    const where = {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(className ? { className: { equals: className } } : {}),
      ...(tahunAjaran ? { tahunAjaran: { equals: tahunAjaran } } : {}),
    };

    const totalItems = await prisma.student.count({ where: Object.keys(where).length ? where : undefined });
    const students = await prisma.student.findMany({
      where: Object.keys(where).length ? where : undefined,
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
    // console.error("createStudent error:", e);
    return sendResponse(res, 400, "Gagal membuat siswa");
  }

}

async function getStudent(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return sendResponse(res, 404, "Siswa tidak ditemukan");
    return sendResponse(res, 200, "Data siswa berhasil diambil", student);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil data siswa");
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
    const existing = await prisma.student.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return sendResponse(res, 404, "Siswa tidak ditemukan");
    const updated = await prisma.student.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_STUDENT", entity: "Student", entityId: updated.id });
    return sendResponse(res, 200, "Siswa berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 500, "Gagal memperbarui siswa");
  }
}

async function deleteStudent(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  try {
    const existing = await prisma.student.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return sendResponse(res, 404, "Siswa tidak ditemukan");

    await prisma.$transaction(async (tx) => {
      await tx.studentReportAnswer.deleteMany({
        where: {
          studentReport: {
            studentId: id,
          },
        },
      });

      await tx.studentReport.deleteMany({ where: { studentId: id } });
      await tx.report.deleteMany({ where: { studentId: id } });
      await tx.student.delete({ where: { id } });
    });

    await logActivity({ userId: req.user.id, action: "DELETE_STUDENT", entity: "Student", entityId: id });
    return sendResponse(res, 200, "Siswa berhasil dihapus");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return sendResponse(res, 409, "Siswa tidak bisa dihapus karena masih digunakan pada data lain");
    }
    return sendResponse(res, 500, "Gagal menghapus siswa");
  }
}

async function downloadStudentsXlsx(req, res) {
  try {
    const { q, className, tahunAjaran } = normalizeAliasFilters(req.query || {});

    const where = {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(className ? { className: { equals: className } } : {}),
      ...(tahunAjaran ? { tahunAjaran: { equals: tahunAjaran } } : {}),
    };

    const students = await prisma.student.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { id: "desc" },
    });

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");

    sheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nama", key: "name", width: 25 },
      { header: "Identifier", key: "identifier", width: 20 },
      { header: "NISN", key: "nisn", width: 15 },
      { header: "Kelas", key: "className", width: 15 },
      { header: "Tahun Ajaran", key: "tahunAjaran", width: 18 },
      { header: "Nama Orang Tua", key: "parentName", width: 20 },
      { header: "No. HP", key: "parentPhone", width: 15 },
      { header: "Alamat", key: "address", width: 30 },
      { header: "Foto URL", key: "photoUrl", width: 30 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const s of students) {
      sheet.addRow({
        id: s.id,
        name: s.name,
        identifier: s.identifier,
        nisn: s.nisn || "",
        className: s.className || "",
        tahunAjaran: s.tahunAjaran || "",
        parentName: s.parentName || "",
        parentPhone: s.parentPhone || "",
        address: s.address || "",
        photoUrl: s.photoUrl || "",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="students_${Date.now()}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat file XLSX");
  }
}

async function getStudentsOptions(req, res) {
  try {
    const q = req.query.q ? String(req.query.q).trim() : undefined;
    const className = req.query.className ? String(req.query.className).trim() : undefined;

    const students = await prisma.student.findMany({
      where: {
        ...(q
          ? {
              name: { contains: q, mode: "insensitive" },
            }
          : {}),
        ...(className
          ? {
              className: { equals: className },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        className: true,
      },
      orderBy: { name: "asc" },
    });
    const options = students.map((s) => ({
      id: s.id,
      className: s.className,
      value: s.id,
      label: `${s.name}`,
    }));

    return sendResponse(res, 200, "Opsi siswa berhasil diambil", options);

  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil opsi siswa");
  }
}

module.exports = { listStudents, downloadStudentsXlsx, createStudent, getStudent, updateStudent, deleteStudent, getStudentsOptions };

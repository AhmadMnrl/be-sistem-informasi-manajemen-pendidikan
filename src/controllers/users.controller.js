const { prisma } = require("../prisma");
const { Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { paginate } = require("../utils/pagination");

async function listUsers(req, res) {
  const { page = 1, pageSize = 5 } = req.query;
  const q = req.query.q || "";

  try {
    const where = q ? { name: { contains: q, mode: "insensitive" } } : undefined;

    const result = await paginate({
      countFn: () => prisma.user.count({ where }),
      queryFn: (offset, ps) =>
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { id: "desc" },
          skip: offset,
          take: ps,
        }),
      page,
      pageSize,
    });

    return sendResponse(res, 200, "Data user berhasil diambil", result);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil data user");
  }
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return sendResponse(res, 400, "Nama, email, password, dan role wajib diisi");
  }

  try {
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return sendResponse(res, 400, "Email sudah terdaftar");

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { name, email, passwordHash, role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    await logActivity({ userId: req.user.id, action: "CREATE_USER", entity: "User", entityId: created.id });
    return sendResponse(res, 201, "User berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat user");
  }
}

async function getUser(req, res) {
  const id = Number(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return sendResponse(res, 404, "User tidak ditemukan");
    return sendResponse(res, 200, "Data user berhasil diambil", user);
  } catch (e) {
    return sendResponse(res, 404, "User tidak ditemukan");
  }
}

async function updateUser(req, res) {
  const id = Number(req.params.id);
  const { name, email, password, role } = req.body || {};
  const data = {};

  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password !== undefined) data.passwordHash = await bcrypt.hash(password, 10);
  if (role !== undefined) data.role = role;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await logActivity({ userId: req.user.id, action: "UPDATE_USER", entity: "User", entityId: updated.id });
    return sendResponse(res, 200, "User berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 400, "Gagal memperbarui user");
  }
}

async function deleteUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");
  if (req.user?.id === id) return sendResponse(res, 400, "Tidak dapat menghapus akun sendiri");

  try {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return sendResponse(res, 404, "User tidak ditemukan");

    const adminAssignee = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        id: { not: id },
      },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (!adminAssignee) {
      return sendResponse(res, 400, "Tidak ada user admin tujuan untuk reassignment");
    }

    await prisma.$transaction(async (tx) => {
      await tx.report.updateMany({ where: { teacherId: id }, data: { teacherId: adminAssignee.id } });
      await tx.document.updateMany({ where: { uploadedById: id }, data: { uploadedById: adminAssignee.id } });
      await tx.anecdote.updateMany({ where: { teacherId: id }, data: { teacherId: adminAssignee.id } });
      await tx.question.updateMany({ where: { teacherId: id }, data: { teacherId: adminAssignee.id } });
      await tx.ape.updateMany({ where: { updatedById: id }, data: { updatedById: adminAssignee.id } });
      await tx.ape.updateMany({ where: { createdById: id }, data: { createdById: adminAssignee.id } });
      await tx.reportTemplate.updateMany({ where: { createdById: id }, data: { createdById: adminAssignee.id } });
      await tx.studentReport.updateMany({ where: { createdById: id }, data: { createdById: adminAssignee.id } });
      await tx.activityLog.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    await logActivity({ userId: req.user.id, action: "DELETE_USER", entity: "User", entityId: id });
    return sendResponse(res, 200, "User berhasil dihapus");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return sendResponse(res, 409, "User tidak bisa dihapus karena masih digunakan pada data lain");
    }

    return sendResponse(res, 500, "Gagal menghapus user");
  }
}

async function getTeachersOptions(req, res) {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "GURU" },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
    const options = teachers.map((t) => ({ label: t.name, value: t.id }));
    return sendResponse(res, 200, "Opsi guru berhasil diambil", options);
  } catch (e) {
    return sendResponse(res, 500, "Gagal mengambil opsi guru");
  }
}

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser, getTeachersOptions };

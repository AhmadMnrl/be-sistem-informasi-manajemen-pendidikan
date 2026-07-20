const { prisma } = require("../prisma");
const { sendResponse } = require("../utils/response");

async function listLogs(req, res) {
  try {
    const { action, entity, entityIdFrom, entityIdTo, userId, dateFrom, dateTo } = req.query;

    const where = {
      ...(action && String(action).trim() ? { action: { equals: String(action).trim() } } : {}),
      ...(entity && String(entity).trim() ? { entity: { equals: String(entity).trim() } } : {}),
      ...(userId ? { userId: Number(userId) } : {}),
      ...((entityIdFrom || entityIdTo) ? {
        entityId: {
          ...(entityIdFrom !== undefined && entityIdFrom !== "" ? { gte: Number(entityIdFrom) } : {}),
          ...(entityIdTo !== undefined && entityIdTo !== "" ? { lte: Number(entityIdTo) } : {}),
        },
      } : {}),
      ...((dateFrom || dateTo) ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      } : {}),
    };

    const whereFinal = Object.keys(where).length ? where : undefined;

    const logs = await prisma.activityLog.findMany({
      where: whereFinal,
      orderBy: { id: "desc" },
      take: 200,
      include: { user: { select: { id: true, name: true } } },
    });

    const logsWithUserName = logs.map((l) => ({
      ...l,
      userName: l.user ? l.user.name : null,
    }));

    return sendResponse(res, 200, "Data log aktivitas berhasil diambil", logsWithUserName);
  } catch (error) {
    console.error("listLogs error:", error);
    return sendResponse(res, 500, "Gagal mengambil data log aktivitas", null, error);
  }
}

module.exports = { listLogs };

const { prisma } = require("../prisma");
const { sendResponse } = require("../utils/response");

async function listLogs(req, res) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { id: "desc" },
      take: 200,
      include: { user: { select: { id: true, name: true } } },
    });

    // Tambahkan `userName` agar front-end mudah mengambil nama user
    const logsWithUserName = logs.map((l) => ({
      ...l,
      userName: l.user ? l.user.name : null,
    }));

    return sendResponse(res, 200, "Data log aktivitas berhasil diambil", logsWithUserName);
  } catch (error) {
    console.error("❌ listLogs error:", error);
    return sendResponse(res, 500, "Gagal mengambil data log aktivitas", null, error);
  }
}

module.exports = { listLogs };

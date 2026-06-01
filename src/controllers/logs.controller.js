const { prisma } = require("../prisma");
const { sendResponse } = require("../utils/response");

async function listLogs(req, res) {
  try {
    const logs = await prisma.activityLog.findMany({ orderBy: { id: "desc" }, take: 200 });
    return sendResponse(res, 200, "Data log aktivitas berhasil diambil", logs);
  } catch (error) {
    console.error("❌ listLogs error:", error);
    return sendResponse(res, 500, "Gagal mengambil data log aktivitas", null, error);
  }
}

module.exports = { listLogs };

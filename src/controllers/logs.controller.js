const { prisma } = require('../prisma');
const { sendResponse } = require('../utils/response');

async function listLogs(req, res) {
	const logs = await prisma.activityLog.findMany({ orderBy: { id: 'desc' }, take: 200 });
	return sendResponse(res, 200, 'Data log aktivitas berhasil diambil', logs);
}

module.exports = { listLogs };

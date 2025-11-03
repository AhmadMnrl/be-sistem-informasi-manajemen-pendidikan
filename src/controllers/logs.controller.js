const { prisma } = require('../prisma');

async function listLogs(req, res) {
	const logs = await prisma.activityLog.findMany({ orderBy: { id: 'desc' }, take: 200 });
	return res.json(logs);
}

module.exports = { listLogs };

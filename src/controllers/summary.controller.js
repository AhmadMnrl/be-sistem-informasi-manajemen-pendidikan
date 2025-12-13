const { prisma } = require('../prisma');
const { sendResponse } = require('../utils/response');

function parseDateRange(req) {
	const { from, to, period } = req.query;
	let start, end;
	if (from) start = new Date(from);
	if (to) end = new Date(to);
	// fallback per period jika tidak ada from/to
	const now = new Date();
	if (!start || !end) {
		if (period === 'day') {
			start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		} else if (period === 'year') {
			start = new Date(now.getFullYear(), 0, 1);
			end = new Date(now.getFullYear() + 1, 0, 1);
		} else {
			// default bulan berjalan
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		}
	}
	return { start, end };
}

async function summary(req, res) {
	const { start, end } = parseDateRange(req);
	const whereDate = (field) => ({ [field]: { gte: start, lt: end } });
	const [
		studentsCount,
		reportsCount,
		documentsCount,
		anecdotesCount,
	] = await Promise.all([
		prisma.student.count(),
		prisma.report.count({ where: whereDate('createdAt') }),
		prisma.document.count({ where: whereDate('documentDate') }),
		prisma.anecdote.count({ where: whereDate('date') }),
	]);
	return sendResponse(res, 200, 'Ringkasan statistik berhasil diambil', {
		period: { start, end },
		studentsCount,
		reportsCount,
		documentsCount,
		anecdotesCount,
	});
}

module.exports = { summary };

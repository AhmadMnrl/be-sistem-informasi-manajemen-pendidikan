const { prisma } = require('../prisma');
const { sendResponse } = require('../utils/response');

function parsePaging(req) {
	const page = Math.max(1, Number(req.query.page) || 1);
	const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));
	const skip = (page - 1) * pageSize;
	const take = pageSize;
	return { page, pageSize, skip, take };
}

async function searchAll(req, res) {
	const q = (req.query.q || '').toString();
	const { skip, take, page, pageSize } = parsePaging(req);
	const [students, studentsCount] = await Promise.all([
		prisma.student.findMany({ where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined, orderBy: { id: 'desc' }, skip, take }),
		prisma.student.count({ where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined }),
	]);
	const [documents, documentsCount] = await Promise.all([
		prisma.document.findMany({ where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined, orderBy: { id: 'desc' }, skip, take }),
		prisma.document.count({ where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined }),
	]);
	const [reports, reportsCount] = await Promise.all([
		prisma.report.findMany({ where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined, orderBy: { id: 'desc' }, skip, take }),
		prisma.report.count({ where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined }),
	]);
	return sendResponse(res, 200, 'Pencarian berhasil', {
		query: q,
		page,
		pageSize,
		students: { items: students, total: studentsCount },
		documents: { items: documents, total: documentsCount },
		reports: { items: reports, total: reportsCount },
	});
}

module.exports = { searchAll };

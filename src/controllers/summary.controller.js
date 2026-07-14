const { prisma } = require('../prisma');
const { sendResponse } = require('../utils/response');

async function summary(req, res) {
  try {
    const [
      studentsCount,
      reportsCount,
      documentsCount,
      anecdotesCountTotal,
      guruCount,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.report.count(),
      prisma.document.count(),
      prisma.anecdote.count(),
      prisma.user.count({ where: { role: 'GURU' } }),
    ]);

    let latestAnecdotes = await prisma.anecdote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        description: true,
        category: true,
        date: true,
        createdAt: true,
        teacherId: true,
      },
    });
    const ids = [...new Set(latestAnecdotes.map(a => a.teacherId).filter(Boolean))];
    let teacherMap = new Map();
    if (ids.length) {
      const teachers = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true }
      });
      teacherMap = new Map(teachers.map(t => [t.id, t]));
    }
    latestAnecdotes = latestAnecdotes.map(a => ({
      ...a,
      teacher: a.teacherId ? teacherMap.get(a.teacherId) || null : null,
    }));

    return sendResponse(res, 200, 'Ringkasan statistik berhasil diambil', {
      studentsCount,
      reportsCount,
      documentsCount,
      anecdotesCountTotal,
      guruCount,
      latestAnecdotes,
    });
  } catch (error) {
    console.error('summary error:', error);
    return sendResponse(res, 500, 'Gagal mengambil ringkasan statistik', null, error);
  }
}

module.exports = { summary };

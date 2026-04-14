const { prisma } = require('../prisma');
const { sendResponse } = require('../utils/response');

function mapSectionType(dbType, title, sectionNumber) {
  const isNilai = (title || '').toLowerCase().includes('nilai') || sectionNumber === 0;
  if (isNilai) return 'table_text';
  switch (dbType) {
    case 'TEXT': return 'text';
    default: return 'table';
  }
}

// Flatten payload UI (data/Questions) → answers[] by looking up questionId from active template
function flattenUiPayloadToAnswers(uiBody, templateQuestionsIndex) {
  const answers = [];
  for (const section of uiBody.data || []) {
    for (const q of section.Questions || []) {
      const questionId = templateQuestionsIndex.get(q.Question);
      if (!questionId) continue;
      answers.push({
        questionId,
        answer: q.answer || null,
        photo: q.photo || null,
        ket: q.Ket || null,
        predikat: q.predikat || null,
      });
    }
  }
  return answers;
}

async function getStudentReportDetail(req, res) {
  try {
    const id = Number(req.params.id);
    const report = await prisma.studentReport.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: {
                    options: { orderBy: { id: 'asc' } },
                    studentAnswers: { where: { studentReportId: id } }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!report) return sendResponse(res, 404, 'Laporan siswa tidak ditemukan');

    const formatted = {
      title: report.template.title,
      year: report.year,
      studentId: report.studentId,
      templateId: report.templateId,
      data: report.template.sections.map(section => ({
        Section: `${section.sectionNumber}. ${section.title}`,
        type: mapSectionType(section.type, section.title, section.sectionNumber),
        Questions: section.questions.map(q => {
          const ans = q.studentAnswers[0] || {};
          const base = { Question: q.text, answers: [], answer: '', Ket: ans.ket || '', photo: ans.photoUrl || '', predikat: ans.predikat || '' };
          if (q.type === 'QUESTION') return { ...base, answers: q.options.map(o => o.label), answer: ans.selectedOption || '' };
          if (q.type === 'FREE_TEXT') return { ...base, answers: [], answer: ans.answerText || '' };
          return { ...base, answers: [] };
        })
      }))
    };

    return sendResponse(res, 200, 'Detail laporan siswa berhasil diambil', formatted);
  } catch (error) {
    console.error('❌ getStudentReportDetail error:', error);
    return sendResponse(res, 500, 'Gagal mengambil detail laporan siswa');
  }
}

async function submitStudentReport(req, res) {
  try {
    const { studentId, templateId, year } = req.body;

    // Gunakan template aktif jika templateId tidak dikirim atau ingin force active
    const activeTemplate = await prisma.reportTemplate.findFirst({
      where: { isActive: true },
      include: { sections: { include: { questions: true } } }
    });
    if (!activeTemplate) return sendResponse(res, 404, 'Template aktif tidak ditemukan');

    const effectiveTemplateId = templateId || activeTemplate.id;

    // Index pertanyaan berdasarkan teks untuk memetakan payload UI ke questionId
    const index = new Map();
    for (const s of activeTemplate.sections) for (const q of s.questions) index.set(q.text, q.id);

    const answers = Array.isArray(req.body.answers)
      ? req.body.answers
      : flattenUiPayloadToAnswers(req.body, index);

    const studentReport = await prisma.studentReport.create({
      data: { studentId, templateId: effectiveTemplateId, year, createdById: req.user.id }
    });

    for (const a of answers) {
      const question = await prisma.reportQuestion.findUnique({ where: { id: a.questionId } });
      await prisma.studentReportAnswer.create({
        data: {
          studentReportId: studentReport.id,
          questionId: a.questionId,
          selectedOption: question?.type === 'QUESTION' ? a.answer ?? null : null,
          answerText: question?.type !== 'QUESTION' ? a.answer ?? null : null,
          photoUrl: a.photo ?? null,
          ket: a.ket ?? null,
          predikat: a.predikat ?? null,
        }
      });
    }

    return sendResponse(res, 201, 'Jawaban siswa berhasil disimpan', { id: studentReport.id });
  } catch (error) {
    console.error('❌ submitStudentReport error:', error);
    return sendResponse(res, 500, 'Gagal menyimpan jawaban siswa');
  }
}

module.exports = {
  getStudentReportDetail,
  submitStudentReport,
};
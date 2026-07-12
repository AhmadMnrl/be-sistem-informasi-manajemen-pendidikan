const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { normalizeFilePath } = require("../utils/filePath");

function normalizeSemesterToDb(value) {
  if (value === undefined || value === null || value === "") return "GANJIL";
  if (typeof value === "number") return value === 2 ? "GENAP" : "GANJIL";
  const v = String(value).trim().toLowerCase();
  if (v === "2" || v === "genap") return "GENAP";
  return "GANJIL";
}

function mapSemesterToUi(value) {
  return value === "GENAP" ? "genap" : "ganjil";
}

function normalizeTahunAjaranToDb(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function isValidTahunAjaranFormat(value) {
  if (!value) return false;
  return /^(\d{4})\/(\d{4})$/.test(String(value).trim());
}

function parseYearFromTahunAjaran(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{4})\s*\/\s*(\d{4})/);
  if (!match) return null;
  return Number(match[2]);
}

function formatTahunAjaranFromYear(year) {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return null;
  return `${numericYear - 1}/${numericYear}`;
}

function mapSectionType(dbType, title, sectionNumber) {
  const isNilai = (title || "").toLowerCase().includes("nilai") || sectionNumber === 0;
  if (isNilai) return "table_text";
  switch (dbType) {
    case "TEXT":
      return "text";
    default:
      return "table";
  }
}

function normalizePhotosToArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function serializePhotosToDb(value) {
  const photos = normalizePhotosToArray(value)
    .map((photo) => normalizeFilePath(photo))
    .filter(Boolean);
  if (photos.length === 0) return null;
  if (photos.length === 1) return photos[0];
  return JSON.stringify(photos);
}

function parsePhotosFromDb(value) {
  if (!value) return [];
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
  } catch (_) {
    // ignore and fallback as single url string
  }

  return [value];
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
        photo: q.photos ?? q.photo ?? null,
        ket: q.Ket || null,
        predikat: q.predikat || null,
      });
    }
  }
  return answers;
}

function extractAnswersFromPayload(body, templateQuestionsIndex) {
  return Array.isArray(body.answers) ? body.answers : flattenUiPayloadToAnswers(body, templateQuestionsIndex);
}

function normalizeReportInput(body) {
  const tahunAjaran = normalizeTahunAjaranToDb(body.tahun_ajaran);
  const parsedYearFromTahunAjaran = parseYearFromTahunAjaran(tahunAjaran);
  const numericYear = body.year !== undefined && body.year !== null && body.year !== "" ? Number(body.year) : null;
  const year = Number.isFinite(numericYear) ? numericYear : parsedYearFromTahunAjaran;

  return {
    studentId: Number(body.studentId),
    templateId: Number(body.templateId),
    year,
    tahunAjaran: tahunAjaran || formatTahunAjaranFromYear(year),
    semester: normalizeSemesterToDb(body.semester),
  };
}

async function buildReportAnswerContext(selectedTemplate) {
  const index = new Map();
  const questionTypeById = new Map();

  for (const section of selectedTemplate.sections) {
    for (const question of section.questions) {
      index.set(question.text, question.id);
      questionTypeById.set(question.id, question.type);
    }
  }

  return { index, questionTypeById };
}

async function listStudentReports(req, res) {
  try {
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const templateId = req.query.templateId ? Number(req.query.templateId) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const tahunAjaran = req.query.tahun_ajaran ? normalizeTahunAjaranToDb(req.query.tahun_ajaran) : undefined;
    const semester = req.query.semester ? normalizeSemesterToDb(req.query.semester) : undefined;

    const reports = await prisma.studentReport.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(templateId ? { templateId } : {}),
        ...(year ? { year } : {}),
        ...(tahunAjaran ? { tahunAjaran } : {}),
        ...(semester ? { semester } : {}),
      },
      orderBy: { id: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            identifier: true,
            nisn: true,
            className: true,
            tahunAjaran: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
            year: true,
            isActive: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    const normalizedReports = reports.map((r) => {
      const { tahunAjaran: _tahunAjaran, ...rest } = r;
      return {
        ...rest,
        tahun_ajaran: _tahunAjaran || formatTahunAjaranFromYear(r.year),
        semester: mapSemesterToUi(r.semester),
      };
    });

    return sendResponse(res, 200, "Data laporan siswa berhasil diambil", normalizedReports);
  } catch (error) {
    console.error("❌ listStudentReports error:", error);
    return sendResponse(res, 500, "Gagal mengambil data laporan siswa");
  }
}

async function getStudentReportDetail(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");

    const report = await prisma.studentReport.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            sections: {
              orderBy: { order: "asc" },
              include: {
                questions: {
                  orderBy: { order: "asc" },
                  include: {
                    options: { orderBy: { id: "asc" } },
                    studentAnswers: { where: { studentReportId: id } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!report) return sendResponse(res, 404, "Laporan siswa tidak ditemukan");

    const formatted = {
      templateId: report.templateId,
      title: report.template.title,
      year: report.year,
      tahun_ajaran: report.tahunAjaran || formatTahunAjaranFromYear(report.year),
      semester: mapSemesterToUi(report.semester),
      studentId: report.studentId,
      data: report.template.sections.map((section) => ({
        Section: `${section.title}`,
        Title: `${section.title}`,
        subtitle: section.subtitle || "",
        type: mapSectionType(section.type, section.title, section.sectionNumber),
        Headers: section.headers ? section.headers.split(",").map((h) => h.trim()) : [],
        Questions: section.questions.map((q) => {
          const ans = q.studentAnswers[0] || {};
          const photos = parsePhotosFromDb(ans.photoUrl);
          const base = { Question: q.text, answers: [], answer: "", Ket: ans.ket || "", photo: photos[0] || "", photos, predikat: ans.predikat || "" };
          if (q.type === "QUESTION") return { ...base, answers: q.options.map((o) => o.label), answer: ans.selectedOption || "" };
          if (q.type === "FREE_TEXT") return { ...base, answers: [], answer: ans.answerText || "" };
          return { ...base, answers: [] };
        }),
      })),
    };

    return sendResponse(res, 200, "Detail laporan siswa berhasil diambil", formatted);
  } catch (error) {
    console.error("❌ getStudentReportDetail error:", error);
    return sendResponse(res, 500, "Gagal mengambil detail laporan siswa");
  }
}

async function submitStudentReport(req, res) {
  try {
    const normalizedInput = normalizeReportInput(req.body);

    if (!Number.isInteger(normalizedInput.studentId) || normalizedInput.studentId <= 0) {
      return sendResponse(res, 400, "studentId tidak valid");
    }

    if (!isValidTahunAjaranFormat(normalizedInput.tahunAjaran) || !Number.isInteger(normalizedInput.year)) {
      return sendResponse(res, 400, "Format tahun_ajaran tidak valid. Gunakan format YYYY/YYYY");
    }

    // Gunakan template yang dikirim; fallback ke template aktif
    let selectedTemplate = null;
    if (normalizedInput.templateId) {
      selectedTemplate = await prisma.reportTemplate.findUnique({
        where: { id: normalizedInput.templateId },
        include: { sections: { include: { questions: true } } },
      });
    } else {
      selectedTemplate = await prisma.reportTemplate.findFirst({
        where: { isActive: true },
        include: { sections: { include: { questions: true } } },
      });
    }
    if (!selectedTemplate) return sendResponse(res, 404, "Template tidak ditemukan");

    const existingStudent = await prisma.student.findUnique({
      where: { id: normalizedInput.studentId },
      select: { id: true, name: true },
    });

    if (!existingStudent) {
      return sendResponse(res, 404, "Siswa tidak ditemukan", {
        studentId: normalizedInput.studentId,
      });
    }

    const effectiveTemplateId = selectedTemplate.id;

    const { index, questionTypeById } = await buildReportAnswerContext(selectedTemplate);

    const answers = extractAnswersFromPayload(req.body, index);
    if (!Array.isArray(answers) || answers.length === 0) {
      return sendResponse(res, 400, "Jawaban tidak boleh kosong");
    }

    const invalidQuestionIds = answers.map((a) => Number(a.questionId)).filter((qid) => !questionTypeById.has(qid));

    if (invalidQuestionIds.length > 0) {
      return sendResponse(res, 400, "Ada questionId tidak valid atau bukan milik template", {
        invalidQuestionIds: [...new Set(invalidQuestionIds)],
      });
    }

    const duplicateReport = await prisma.studentReport.findFirst({
      where: {
        studentId: normalizedInput.studentId,
        templateId: effectiveTemplateId,
        tahunAjaran: normalizedInput.tahunAjaran,
        semester: normalizedInput.semester,
      },
    });

    if (duplicateReport) {
      return sendResponse(res, 409, "Data tahun ajaran dan semester sudah ada", {
        id: duplicateReport.id,
      });
    }

    const studentReport = await prisma.$transaction(async (tx) => {
      const createdReport = await tx.studentReport.create({
        data: {
          studentId: normalizedInput.studentId,
          templateId: effectiveTemplateId,
          year: normalizedInput.year,
          tahunAjaran: normalizedInput.tahunAjaran,
          semester: normalizedInput.semester,
          createdById: req.user.id,
        },
      });

      await tx.studentReportAnswer.createMany({
        data: answers.map((a) => {
          const qid = Number(a.questionId);
          const qType = questionTypeById.get(qid);
          return {
            studentReportId: createdReport.id,
            questionId: qid,
            selectedOption: qType === "QUESTION" ? (a.answer ?? null) : null,
            answerText: qType !== "QUESTION" ? (a.answer ?? null) : null,
            photoUrl: serializePhotosToDb(a.photos ?? a.photo ?? null),
            ket: a.ket ?? null,
            predikat: a.predikat ?? null,
          };
        }),
      });

      return createdReport;
    });

    await logActivity({
      userId: req.user.id,
      action: "CREATE_STUDENT_REPORT",
      entity: "StudentReport",
      entityId: studentReport.id,
      metadata: {
        studentId: normalizedInput.studentId,
        templateId: effectiveTemplateId,
        year: normalizedInput.year,
        tahun_ajaran: normalizedInput.tahunAjaran,
        semester: mapSemesterToUi(studentReport.semester),
        answersCount: answers.length,
      },
    });

    return sendResponse(res, 201, "Jawaban siswa berhasil disimpan", { id: studentReport.id, semester: mapSemesterToUi(studentReport.semester) });
  } catch (error) {
    console.error("❌ submitStudentReport error:", error);

    if (error?.code === "P2003") {
      return sendResponse(res, 400, "Referensi data tidak valid. Pastikan siswa, template, dan pertanyaan masih tersedia", {
        constraint: error?.meta?.constraint || null,
      });
    }

    return sendResponse(res, 500, "Gagal menyimpan jawaban siswa");
  }
}

async function updateStudentReport(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");

    const normalizedInput = normalizeReportInput(req.body);

    if (!Number.isInteger(normalizedInput.studentId) || normalizedInput.studentId <= 0) {
      return sendResponse(res, 400, "studentId tidak valid");
    }

    if (!isValidTahunAjaranFormat(normalizedInput.tahunAjaran) || !Number.isInteger(normalizedInput.year)) {
      return sendResponse(res, 400, "Format tahun_ajaran tidak valid. Gunakan format YYYY/YYYY");
    }

    const existingReport = await prisma.studentReport.findUnique({
      where: { id },
      include: { template: { include: { sections: { include: { questions: true } } } } },
    });

    if (!existingReport) return sendResponse(res, 404, "Laporan siswa tidak ditemukan");

    const selectedTemplate = normalizedInput.templateId
      ? await prisma.reportTemplate.findUnique({
          where: { id: normalizedInput.templateId },
          include: { sections: { include: { questions: true } } },
        })
      : existingReport.template;

    if (!selectedTemplate) return sendResponse(res, 404, "Template tidak ditemukan");

    const existingStudent = await prisma.student.findUnique({
      where: { id: normalizedInput.studentId },
      select: { id: true, name: true },
    });

    if (!existingStudent) {
      return sendResponse(res, 404, "Siswa tidak ditemukan", {
        studentId: normalizedInput.studentId,
      });
    }

    const { index, questionTypeById } = await buildReportAnswerContext(selectedTemplate);
    const answers = extractAnswersFromPayload(req.body, index);

    if (!Array.isArray(answers) || answers.length === 0) {
      return sendResponse(res, 400, "Jawaban tidak boleh kosong");
    }

    const invalidQuestionIds = answers.map((a) => Number(a.questionId)).filter((qid) => !questionTypeById.has(qid));
    if (invalidQuestionIds.length > 0) {
      return sendResponse(res, 400, "Ada questionId tidak valid atau bukan milik template", {
        invalidQuestionIds: [...new Set(invalidQuestionIds)],
      });
    }

    const duplicateReport = await prisma.studentReport.findFirst({
      where: {
        studentId: normalizedInput.studentId,
        templateId: selectedTemplate.id,
        tahunAjaran: normalizedInput.tahunAjaran,
        semester: normalizedInput.semester,
        NOT: { id },
      },
    });

    if (duplicateReport) {
      return sendResponse(res, 409, "Data tahun ajaran dan semester sudah ada", {
        id: duplicateReport.id,
      });
    }

    const updatedReport = await prisma.$transaction(async (tx) => {
      const report = await tx.studentReport.update({
        where: { id },
        data: {
          studentId: normalizedInput.studentId,
          templateId: selectedTemplate.id,
          year: normalizedInput.year,
          tahunAjaran: normalizedInput.tahunAjaran,
          semester: normalizedInput.semester,
        },
      });

      await tx.studentReportAnswer.deleteMany({ where: { studentReportId: report.id } });

      await tx.studentReportAnswer.createMany({
        data: answers.map((a) => {
          const qid = Number(a.questionId);
          const qType = questionTypeById.get(qid);
          return {
            studentReportId: report.id,
            questionId: qid,
            selectedOption: qType === "QUESTION" ? (a.answer ?? null) : null,
            answerText: qType !== "QUESTION" ? (a.answer ?? null) : null,
            photoUrl: serializePhotosToDb(a.photos ?? a.photo ?? null),
            ket: a.ket ?? null,
            predikat: a.predikat ?? null,
          };
        }),
      });

      return report;
    });

    await logActivity({
      userId: req.user.id,
      action: "UPDATE_STUDENT_REPORT",
      entity: "StudentReport",
      entityId: updatedReport.id,
      metadata: {
        studentId: normalizedInput.studentId,
        templateId: selectedTemplate.id,
        year: normalizedInput.year,
        tahun_ajaran: normalizedInput.tahunAjaran,
        semester: mapSemesterToUi(updatedReport.semester),
        answersCount: answers.length,
      },
    });

    return sendResponse(res, 200, "Jawaban siswa berhasil diperbarui", {
      id: updatedReport.id,
      tahun_ajaran: normalizedInput.tahunAjaran,
      semester: mapSemesterToUi(updatedReport.semester),
    });
  } catch (error) {
    console.error("❌ updateStudentReport error:", error);

    if (error?.code === "P2003") {
      return sendResponse(res, 400, "Referensi data tidak valid. Pastikan siswa, template, dan pertanyaan masih tersedia", {
        constraint: error?.meta?.constraint || null,
      });
    }

    return sendResponse(res, 500, "Gagal memperbarui jawaban siswa");
  }
}

async function deleteStudentReport(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");

    const existingReport = await prisma.studentReport.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingReport) return sendResponse(res, 404, "Laporan siswa tidak ditemukan");

    await prisma.$transaction(async (tx) => {
      await tx.studentReportAnswer.deleteMany({ where: { studentReportId: id } });
      await tx.studentReport.delete({ where: { id } });
    });

    await logActivity({
      userId: req.user.id,
      action: "DELETE_STUDENT_REPORT",
      entity: "StudentReport",
      entityId: id,
    });

    return sendResponse(res, 200, "Laporan siswa berhasil dihapus");
  } catch (error) {
    console.error("❌ deleteStudentReport error:", error);
    return sendResponse(res, 500, "Gagal menghapus laporan siswa");
  }
}

async function downloadStudentReportsXlsx(req, res) {
  try {
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const templateId = req.query.templateId ? Number(req.query.templateId) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const tahunAjaran = req.query.tahun_ajaran ? normalizeTahunAjaranToDb(req.query.tahun_ajaran) : undefined;
    const semester = req.query.semester ? normalizeSemesterToDb(req.query.semester) : undefined;

    const reports = await prisma.studentReport.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(templateId ? { templateId } : {}),
        ...(year ? { year } : {}),
        ...(tahunAjaran ? { tahunAjaran } : {}),
        ...(semester ? { semester } : {}),
      },
      orderBy: { id: "desc" },
      include: {
        student: { select: { id: true, name: true, className: true, tahunAjaran: true } },
        template: { include: { sections: { orderBy: { order: "asc" }, include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { id: "asc" } }, studentAnswers: { where: { studentReportId: undefined } } } } } } } },
      },
    });

    // Untuk detail jawaban kita butuh studentAnswers per reportId.
    // Ambil lagi secara efisien: fetch answers + template struktur per templateId.
    const reportIds = reports.map((r) => r.id);
    const [answersRows] = await Promise.all([
      prisma.studentReportAnswer.findMany({
        where: { studentReportId: { in: reportIds } },
        select: { studentReportId: true, questionId: true, selectedOption: true, answerText: true, ket: true, predikat: true, photoUrl: true },
      }),
    ]);

    const templateIds = [...new Set(reports.map((r) => r.templateId))].filter(Boolean);
    const templates = await prisma.reportTemplate.findMany({
      where: { id: { in: templateIds } },
      include: { sections: { orderBy: { order: "asc" }, include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { id: "asc" } } } } } } },
    });
    const templateById = new Map(templates.map((t) => [t.id, t]));

    const answersByReport = new Map();
    for (const a of answersRows) {
      if (!answersByReport.has(a.studentReportId)) answersByReport.set(a.studentReportId, []);
      answersByReport.get(a.studentReportId).push(a);
    }
    const answersByReportQuestion = new Map();
    for (const a of answersRows) {
      answersByReportQuestion.set(`${a.studentReportId}:${a.questionId}`, a);
    }

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("StudentReportsDetail");

    sheet.columns = [
      { header: "Report ID", key: "reportId", width: 10 },
      { header: "Siswa", key: "studentName", width: 25 },
      { header: "Kelas", key: "className", width: 15 },
      { header: "Tahun Ajaran", key: "studentTahunAjaran", width: 16 },
      { header: "Template", key: "templateTitle", width: 25 },
      { header: "Tahun (Report)", key: "reportYear", width: 12 },
      { header: "Tahun Ajaran (Report)", key: "tahunAjaran", width: 16 },
      { header: "Semester", key: "semester", width: 10 },
      { header: "Section", key: "section", width: 22 },
      { header: "Question", key: "question", width: 30 },
      { header: "Ket", key: "ket", width: 20 },
      { header: "Predikat", key: "predikat", width: 15 },
      { header: "Jawaban", key: "answer", width: 35 },
      { header: "Photo URL", key: "photoUrl", width: 30 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const r of reports) {
      const tmpl = templateById.get(r.templateId);
      if (!tmpl) continue;

      const studentTahun = r.student?.tahunAjaran || "";
      const tahun_ajaran_report = r.tahunAjaran || formatTahunAjaranFromYear(r.year) || "";
      const semesterUi = mapSemesterToUi(r.semester);

      for (const section of tmpl.sections) {
        const sectionTitle = section.title || section.headers || "";
        for (const q of section.questions) {
          const ans = answersByReportQuestion.get(`${r.id}:${q.id}`) || {};
          const photoArr = parsePhotosFromDb(ans.photoUrl);
          const answer = q.type === "QUESTION" ? ans.selectedOption || "" : ans.answerText || "";

          sheet.addRow({
            reportId: r.id,
            studentName: r.student?.name || "",
            className: r.student?.className || "",
            studentTahunAjaran: studentTahun,
            templateTitle: r.template?.title || tmpl.title || "",
            reportYear: r.year || "",
            tahunAjaran: tahun_ajaran_report,
            semester: semesterUi,
            section: section.title || q.sectionId || "",
            question: q.text,
            ket: ans.ket || "",
            predikat: ans.predikat || "",
            answer: answer,
            photoUrl: photoArr[0] || "",
          });
        }
      }
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=student_rapor_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat file XLSX rapor");
  }
}

module.exports = {
  listStudentReports,
  getStudentReportDetail,
  downloadStudentReportsXlsx,
  submitStudentReport,
  updateStudentReport,
  deleteStudentReport,
};


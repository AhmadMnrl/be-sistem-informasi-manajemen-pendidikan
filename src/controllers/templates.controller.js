const { prisma } = require("../prisma");
const { sendResponse } = require("../utils/response");

function mapSectionType(dbType, title, sectionNumber) {
  const isNilai = (title || "").toLowerCase().includes("nilai") || sectionNumber === 0;
  if (isNilai) return "table_text";
  switch (dbType) {
    case "QUESTION":
      return "table_option";
    case "FREE_TEXT":
      return "text";
    case "PHOTO":
      return "text";
    default:
      return "table";
  }
}

async function getActiveTemplate(req, res) {
  try {
    const template = await prisma.reportTemplate.findFirst({
      where: { isActive: true },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: { options: { orderBy: { id: "asc" } } },
            },
          },
        },
      },
    });
    if (!template) return sendResponse(res, 404, "Template rapor aktif belum tersedia");

    const formatted = {
      title: template.title,
      year: template.year,
      data: template.sections.map((section) => ({
        Section: `${section.title}`,
        Title: `${section.title}`,
        type: mapSectionType(section.type, section.title, section.sectionNumber),
        Headers: section.headers ? section.headers.split(",").map((h) => h.trim()) : [],
        Questions: section.questions.map((q) => {
          const base = { Question: q.text, answer: "", answers: [], photo: "", Ket: "", predikat: "" };
          if (q.type === "QUESTION") return { ...base, answers: q.options.map((o) => o.label) };
          if (q.type === "PHOTO") return { ...base, answers: [], photo: "" };
          return { ...base, answers: [] };
        }),
      })),
    };

    return sendResponse(res, 200, "Data template aktif berhasil diambil", formatted);
  } catch (error) {
    console.error("❌ getActiveTemplate error:", error);
    return sendResponse(res, 500, "Gagal mengambil template aktif");
  }
}

// Create template baru → nonaktifkan yang lama, aktifkan yang baru
async function createTemplateFromUi(req, res) {
  try {
    const { title, year, data } = req.body;

    // Nonaktifkan semua template aktif sebelumnya
    await prisma.reportTemplate.updateMany({ where: { isActive: true }, data: { isActive: false } });

    // Buat template baru dan set aktif
    const template = await prisma.reportTemplate.create({
      data: { title, year, isActive: true, createdById: req.user.id },
    });

    // Buat sections & questions
    for (let i = 0; i < data.length; i++) {
      const sec = data[i];
      const sectionNumber = Number(String(sec.Section).split(".")[0]) || i;
      const prismaSectionType = sec.type === "text" || sec.type === "table_text" ? "TEXT" : "TABLE";

      const section = await prisma.reportSection.create({
        data: {
          templateId: template.id,
          sectionNumber,
          order: i,
          type: prismaSectionType,
          headers: sec.headers ? sec.headers.join(",") : null,
          title: String(sec.Section).replace(/^\d+\.\s*/, ""),
        },
      });

      for (let j = 0; j < (sec.Questions || []).length; j++) {
        const q = sec.Questions[j];
        let prismaQuestionType = "FREE_TEXT";
        if (Array.isArray(q.answers) && q.answers.length) prismaQuestionType = "QUESTION";
        else if (typeof q.photo === "string") prismaQuestionType = "PHOTO";

        const question = await prisma.reportQuestion.create({
          data: { sectionId: section.id, text: q.Question, order: j, type: prismaQuestionType },
        });

        if (prismaQuestionType === "QUESTION" && Array.isArray(q.answers)) {
          for (const opt of q.answers) {
            await prisma.reportAnswerOption.create({ data: { questionId: question.id, label: opt } });
          }
        }
      }
    }

    return sendResponse(res, 201, "Template baru dibuat dan diaktifkan", { id: template.id, isActive: true });
  } catch (error) {
    console.error("❌ createTemplateFromUi error:", error);
    return sendResponse(res, 500, "Gagal membuat template");
  }
}

// Optional: endpoint untuk mengaktifkan template tertentu (toggle aktif)
async function activateTemplate(req, res) {
  try {
    const id = Number(req.params.id);
    const exists = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!exists) return sendResponse(res, 404, "Template tidak ditemukan");

    await prisma.reportTemplate.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const updated = await prisma.reportTemplate.update({ where: { id }, data: { isActive: true } });

    return sendResponse(res, 200, "Template diaktifkan", { id: updated.id, isActive: true });
  } catch (error) {
    console.error("❌ activateTemplate error:", error);
    return sendResponse(res, 500, "Gagal mengaktifkan template");
  }
}

module.exports = {
  getActiveTemplate,
  createTemplateFromUi,
  activateTemplate,
};

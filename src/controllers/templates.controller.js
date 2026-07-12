const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");

function mapSectionType(dbType, title, sectionNumber) {
  const isNilai = (title || "").toLowerCase().includes("nilai") || sectionNumber === 0;
  switch (dbType) {
    case "TEXT":
      return isNilai ? "table_text" : "text";
    case "TABLE":
      return "table";
    case "MIXED":
      return "table_text";
    default:
      return isNilai ? "table_text" : "table";
  }
}

async function rebuildTemplateStructure(tx, templateId, data) {
  await tx.studentReportAnswer.deleteMany({
    where: { question: { section: { templateId } } },
  });
  await tx.reportAnswerOption.deleteMany({
    where: { question: { section: { templateId } } },
  });
  await tx.reportQuestion.deleteMany({
    where: { section: { templateId } },
  });
  await tx.reportSection.deleteMany({
    where: { templateId },
  });

  for (let i = 0; i < data.length; i++) {
    const sec = data[i];
    const sectionNumber = Number(String(sec.Section).split(".")[0]) || i;
    let prismaSectionType = "TABLE";
    if (sec.type === "text") prismaSectionType = "TEXT";
    else if (sec.type === "table_text") prismaSectionType = "MIXED";

    const section = await tx.reportSection.create({
      data: {
        templateId,
        sectionNumber,
        order: i,
        type: prismaSectionType,
        headers: sec.headers ? sec.headers.join(",") : null,
        title: String(sec.Section).replace(/^\d+\.\s*/, ""),
        subtitle: sec.subtitle ?? null,
      },
    });

    for (let j = 0; j < (sec.Questions || []).length; j++) {
      const q = sec.Questions[j];
      let prismaQuestionType = "FREE_TEXT";
      const hasPhoto = (typeof q.photo === "string" && q.photo.trim().length > 0) || (Array.isArray(q.photo) && q.photo.length > 0) || (Array.isArray(q.photos) && q.photos.length > 0);
      if (Array.isArray(q.answers) && q.answers.length) prismaQuestionType = "QUESTION";
      else if (hasPhoto) prismaQuestionType = "PHOTO";

      const question = await tx.reportQuestion.create({
        data: { sectionId: section.id, text: q.Question, order: j, type: prismaQuestionType },
      });

      if (prismaQuestionType === "QUESTION" && Array.isArray(q.answers)) {
        for (const opt of q.answers) {
          await tx.reportAnswerOption.create({ data: { questionId: question.id, label: opt } });
        }
      }
    }
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
      templateId: template.id,
      title: template.title,
      year: template.year,
      data: template.sections.map((section) => ({
        Section: `${section.title}`,
        Title: `${section.title}`,
        subtitle: section.subtitle || "",
        type: mapSectionType(section.type, section.title, section.sectionNumber),
        Headers: section.headers ? section.headers.split(",").map((h) => h.trim()) : [],
        Questions: section.questions.map((q) => {
          const base = { Question: q.text, answer: "", answers: [], photo: "", photos: [], Ket: "", predikat: "" };
          if (q.type === "QUESTION") return { ...base, answers: q.options.map((o) => o.label) };
          if (q.type === "PHOTO") return { ...base, answers: [], photo: "", photos: [] };
          return { ...base, answers: [] };
        }),
      })),
    };

    return sendResponse(res, 200, "Data template aktif berhasil diambil", formatted);
  } catch (error) {
    console.error("getActiveTemplate error:", error);
    return sendResponse(res, 500, "Gagal mengambil template aktif");
  }
}

// Create template baru → nonaktifkan yang lama, aktifkan yang baru
async function createTemplateFromUi(req, res) {
  try {
    const { title, year, data } = req.body;
    const normalizedTitle = String(title || "").trim();
    const activeTemplate = await prisma.reportTemplate.findFirst({
      where: { isActive: true },
      orderBy: { id: "desc" },
      select: { id: true, title: true },
    });

    const isSameTitleAsActive =
      !!activeTemplate &&
      String(activeTemplate.title || "")
        .trim()
        .toLowerCase() === normalizedTitle.toLowerCase();

    if (isSameTitleAsActive) {
      const updated = await prisma.$transaction(async (tx) => {
        const template = await tx.reportTemplate.update({
          where: { id: activeTemplate.id },
          data: { title: normalizedTitle, year, isActive: true },
        });

        await rebuildTemplateStructure(tx, template.id, data);
        return template;
      });

      await logActivity({
        userId: req.user.id,
        action: "UPDATE_TEMPLATE",
        entity: "ReportTemplate",
        entityId: updated.id,
        metadata: { title: normalizedTitle, year, sections: Array.isArray(data) ? data.length : 0 },
      });

      return sendResponse(res, 200, "Template aktif berhasil diperbarui", { id: updated.id, isActive: true, mode: "update" });
    }

    const created = await prisma.$transaction(async (tx) => {
      await tx.reportTemplate.updateMany({ where: { isActive: true }, data: { isActive: false } });

      const template = await tx.reportTemplate.create({
        data: { title: normalizedTitle, year, isActive: true, createdById: req.user.id },
      });

      await rebuildTemplateStructure(tx, template.id, data);
      return template;
    });

    await logActivity({
      userId: req.user.id,
      action: "CREATE_TEMPLATE",
      entity: "ReportTemplate",
      entityId: created.id,
      metadata: { title: normalizedTitle, year, sections: Array.isArray(data) ? data.length : 0, mode: "create-new" },
    });

    return sendResponse(res, 201, "Template baru dibuat dan diaktifkan", { id: created.id, isActive: true, mode: "create" });
  } catch (error) {
    console.error("createTemplateFromUi error:", error);
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

    await logActivity({
      userId: req.user.id,
      action: "ACTIVATE_TEMPLATE",
      entity: "ReportTemplate",
      entityId: updated.id,
      metadata: { isActive: true },
    });

    return sendResponse(res, 200, "Template diaktifkan", { id: updated.id, isActive: true });
  } catch (error) {
    console.error("ActivateTemplate error:", error);
    return sendResponse(res, 500, "Gagal mengaktifkan template");
  }
}

module.exports = {
  getActiveTemplate,
  createTemplateFromUi,
  activateTemplate,
};

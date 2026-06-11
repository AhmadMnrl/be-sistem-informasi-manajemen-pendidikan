const { prisma } = require("../prisma");
const { logActivity } = require("../utils/activityLog");
const { sendResponse } = require("../utils/response");
const { buildImagePath, normalizeFilePath } = require("../utils/filePath");

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return value;
  }
}

function normalizeQuestionsPayload(rawQuestions, fallbackImageUrl = null) {
  const parsed = parseMaybeJson(rawQuestions);
  if (!Array.isArray(parsed)) return null;

  return parsed.map((item) => ({
    text: item?.text,
    imageUrl: normalizeFilePath(item?.imageUrl ?? fallbackImageUrl),
  }));
}

function buildQuestionImageMap(files) {
  const imageMap = new Map();

  if (!Array.isArray(files)) return imageMap;

  for (const file of files) {
    const match = file?.fieldname?.match(/^questions\[(\d+)\]\[(imageUrl|photo|image)\]$/);
    if (match) {
      imageMap.set(Number(match[1]), buildImagePath(file.filename));
      continue;
    }

    if (["imageUrl", "photo", "image"].includes(file?.fieldname)) {
      imageMap.set(0, buildImagePath(file.filename));
    }
  }

  return imageMap;
}

function mapQuestionRecord(question) {
  return {
    id: question.id,
    text: question.text,
    imageUrl: question.imageUrl,
  };
}

function mapSectionSummary(section) {
  return {
    id: section._min.id,
    section: section.section,
    totalQuestions: section._count.id,
  };
}

async function listQuestions(req, res) {
  return listQuestionSections(req, res);
}

async function listQuestionSections(req, res) {
  try {
    const q = req.query.q || "";
    const sections = await prisma.question.groupBy({
      by: ["section"],
      where: q ? { text: { contains: q, mode: "insensitive" } } : undefined,
      _min: { id: true },
      _count: { id: true },
      orderBy: { _min: { id: "desc" } },
    });

    const items = sections.map(mapSectionSummary);

    return sendResponse(res, 200, "Data section soal berhasil diambil", items);
  } catch (error) {
    console.error("❌ listQuestionSections error:", error);
    return sendResponse(res, 500, "Gagal mengambil data section soal");
  }
}

async function getQuestionSectionDetail(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");

    const sectionQuestion = await prisma.question.findUnique({
      where: { id },
      select: { section: true },
    });

    if (!sectionQuestion) return sendResponse(res, 404, "Section tidak ditemukan");

    const items = await prisma.question.findMany({
      where: { section: sectionQuestion.section },
      orderBy: { id: "asc" },
    });

    return sendResponse(res, 200, "Detail section soal berhasil diambil", {
      id,
      section: sectionQuestion.section,
      totalQuestions: items.length,
      questions: items.map(mapQuestionRecord),
    });
  } catch (error) {
    console.error("❌ getQuestionSectionDetail error:", error);
    return sendResponse(res, 500, "Gagal mengambil detail section soal");
  }
}

async function updateQuestionSection(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");

    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      select: { section: true },
    });

    if (!existingQuestion) return sendResponse(res, 404, "Section tidak ditemukan");

    const { section } = req.body || {};
    const normalizedSection = String(section || existingQuestion.section || "Section 1").trim();
    const uploadedImageMap = buildQuestionImageMap(req.files);
    const questions = normalizeQuestionsPayload(req.body?.questions);

    if (!Array.isArray(questions) || questions.length === 0) {
      return sendResponse(res, 400, "questions[] wajib diisi untuk update section");
    }

    const questionsWithImages = questions.map((item, index) => ({
      ...item,
      imageUrl: item.imageUrl ?? uploadedImageMap.get(index) ?? null,
    }));

    const updatedItems = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { section: existingQuestion.section } });

      return tx.question.createMany({
        data: questionsWithImages.map((item) => ({
          text: item.text,
          section: normalizedSection,
          imageUrl: item.imageUrl ?? null,
          teacherId: req.user.id,
        })),
      });
    });

    const refreshedItems = await prisma.question.findMany({
      where: { section: normalizedSection },
      orderBy: { id: "asc" },
    });

    await logActivity({
      userId: req.user.id,
      action: "UPDATE_QUESTION_SECTION",
      entity: "Question",
      entityId: refreshedItems[0]?.id ?? id,
      metadata: { section: normalizedSection, count: refreshedItems.length },
    });

    return sendResponse(res, 200, "Section soal berhasil diperbarui", {
      id: refreshedItems[0]?.id ?? id,
      section: normalizedSection,
      totalQuestions: refreshedItems.length,
      questions: refreshedItems.map(mapQuestionRecord),
    });
  } catch (error) {
    console.error("❌ updateQuestionSection error:", error);
    return sendResponse(res, 500, "Gagal memperbarui section soal");
  }
}

async function createQuestion(req, res) {
  const { text, questions, section, imageUrl } = req.body || {};
  const normalizedSection = String(section || "Section 1").trim();
  const uploadedImageUrl = req.file ? buildImagePath(req.file.filename) : null;
  const teacherId = req.user.id;
  try {
    if (Array.isArray(questions) && questions.length > 0) {
      const uploadedImageMap = buildQuestionImageMap(req.files);
      const questionsWithImages = questions.map((item, index) => ({
        ...item,
        imageUrl: item?.imageUrl ?? uploadedImageMap.get(index) ?? null,
      }));

      const createdItems = await prisma.$transaction(
        questionsWithImages.map((item) =>
          prisma.question.create({
            data: {
              text: item.text,
              section: normalizedSection,
              imageUrl: item.imageUrl ?? null,
              teacherId,
            },
          }),
        ),
      );

      await logActivity({
        userId: req.user.id,
        action: "CREATE_QUESTION_BULK",
        entity: "Question",
        entityId: createdItems[0]?.id,
        metadata: { count: createdItems.length, section: normalizedSection },
      });

      return sendResponse(res, 201, "Soal per section berhasil dibuat", {
        section: normalizedSection,
        count: createdItems.length,
        items: createdItems,
      });
    }

    const resolvedImageUrl = uploadedImageUrl || normalizeFilePath(imageUrl);
    const created = await prisma.question.create({ data: { text, imageUrl: resolvedImageUrl, section: normalizedSection, teacherId } });
    await logActivity({
      userId: req.user.id,
      action: "CREATE_QUESTION",
      entity: "Question",
      entityId: created.id,
      metadata: { section: normalizedSection },
    });
    return sendResponse(res, 201, "Soal berhasil dibuat", created);
  } catch (e) {
    return sendResponse(res, 500, "Gagal membuat soal");
  }
}

async function getQuestion(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return sendResponse(res, 400, "id tidak valid");

  const item = await prisma.question.findUnique({ where: { id } });
  if (!item) return sendResponse(res, 404, "Soal tidak ditemukan");
  return sendResponse(res, 200, "Data soal berhasil diambil", item);
}

async function updateQuestion(req, res) {
  const id = Number(req.params.id);
  const { text, section, imageUrl } = req.body || {};
  const data = {};
  if (text !== undefined) data.text = text;
  if (section !== undefined) data.section = section;
  if (req.file) data.imageUrl = buildImagePath(req.file.filename);
  else if (imageUrl !== undefined) data.imageUrl = normalizeFilePath(imageUrl);
  try {
    const updated = await prisma.question.update({ where: { id }, data });
    await logActivity({ userId: req.user.id, action: "UPDATE_QUESTION", entity: "Question", entityId: updated.id });
    return sendResponse(res, 200, "Soal berhasil diperbarui", updated);
  } catch (e) {
    return sendResponse(res, 404, "Soal tidak ditemukan");
  }
}

async function deleteQuestion(req, res) {
  const id = Number(req.params.id);
  try {
    await prisma.question.delete({ where: { id } });
    await logActivity({ userId: req.user.id, action: "DELETE_QUESTION", entity: "Question", entityId: id });
    return sendResponse(res, 200, "Soal berhasil dihapus");
  } catch (e) {
    return sendResponse(res, 404, "Soal tidak ditemukan");
  }
}

module.exports = {
  listQuestions,
  listQuestionSections,
  getQuestionSectionDetail,
  updateQuestionSection,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};

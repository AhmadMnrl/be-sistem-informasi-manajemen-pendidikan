const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { uploadImage } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { questionCreateSchema, questionUpdateSchema, questionSectionUpdateSchema } = require("../validators/schemas");
const { listQuestions, listQuestionSections, getQuestionSectionDetail, createQuestion, getQuestion, updateQuestion, deleteQuestion } = require("../controllers/questions.controller");
const { updateQuestionSection } = require("../controllers/questions.controller");

const router = express.Router();

function parseQuestionsBody(req, res, next) {
  if (typeof req.body?.questions === "string") {
    try {
      req.body.questions = JSON.parse(req.body.questions);
    } catch (_) {
      // biarkan validator yang menangani format invalid
    }
  }
  next();
}

function normalizeFirstUploadedFile(req, res, next) {
  if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
    req.file = req.files[0];
  }
  next();
}

router.use(authMiddleware);

router.get("/", listQuestionSections);
router.get("/sections", listQuestionSections);
router.get("/sections/:id", getQuestionSectionDetail);

const uploadQuestionFiles = uploadImage.any();
router.post("/", uploadQuestionFiles, normalizeFirstUploadedFile, parseQuestionsBody, validate({ body: questionCreateSchema }), createQuestion);
router.put("/sections/:id", uploadQuestionFiles, normalizeFirstUploadedFile, parseQuestionsBody, validate({ body: questionSectionUpdateSchema }), updateQuestionSection);
router.put("/:id", uploadQuestionFiles, normalizeFirstUploadedFile, parseQuestionsBody, validate({ body: questionUpdateSchema }), updateQuestion);
router.delete("/:id", deleteQuestion);

module.exports = router;

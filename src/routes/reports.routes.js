const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { uploadImage, useFirstUploadedFile, IMAGE_UPLOAD_FIELDS } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { reportCreateSchema, reportUpdateSchema } = require("../validators/schemas");
const { listReports, createReport, getReport, updateReport, deleteReport } = require("../controllers/reports.controller");

const router = express.Router();

router.use(authMiddleware); // Semua role bisa baca

router.get("/", listReports);
router.get("/:id", getReport);

// Semua role bisa write (Admin, Kepsek, Guru)
const uploadReportPhoto = uploadImage.fields(IMAGE_UPLOAD_FIELDS.map((name) => ({ name, maxCount: 1 })));
router.post("/", uploadReportPhoto, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: reportCreateSchema }), createReport);
router.put("/:id", uploadReportPhoto, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: reportUpdateSchema }), updateReport);
router.delete("/:id", deleteReport);

module.exports = router;

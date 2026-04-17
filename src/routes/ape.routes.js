const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { uploadImage, useFirstUploadedFile, IMAGE_UPLOAD_FIELDS } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { apeCreateSchema, apeUpdateSchema } = require("../validators/schemas");
const { listApe, createApe, getApe, updateApe, deleteApe } = require("../controllers/ape.controller");

const router = express.Router();

router.use(authMiddleware); // Semua role bisa akses (Admin, Kepsek, Guru)

const uploadApeImage = uploadImage.fields(IMAGE_UPLOAD_FIELDS.map((name) => ({ name, maxCount: 1 })));

router.get("/", listApe);
router.get("/:id", getApe);
router.post("/", uploadApeImage, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: apeCreateSchema }), createApe);
router.put("/:id", uploadApeImage, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: apeUpdateSchema }), updateApe);
router.delete("/:id", deleteApe);

module.exports = router;

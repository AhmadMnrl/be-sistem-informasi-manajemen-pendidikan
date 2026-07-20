const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { uploadDocument, useFirstUploadedFile, DOCUMENT_UPLOAD_FIELDS } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { documentCreateSchema, documentUpdateSchema } = require("../validators/schemas");
const { listDocuments, createDocument, getDocument, updateDocument, deleteDocument, downloadDocument, viewDocumentFile } = require("../controllers/documents.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listDocuments);
router.get("/:id", getDocument);
router.get("/:id/download", downloadDocument);
router.get("/:id/view", viewDocumentFile);

const uploadDocumentFields = uploadDocument.fields(DOCUMENT_UPLOAD_FIELDS.map((name) => ({ name, maxCount: 1 })));

router.post("/", authorize("ADMIN", "KEPALA_SEKOLAH"), uploadDocumentFields, useFirstUploadedFile(DOCUMENT_UPLOAD_FIELDS), validate({ body: documentCreateSchema }), createDocument);
router.put("/:id", authorize("ADMIN", "KEPALA_SEKOLAH"), uploadDocumentFields, useFirstUploadedFile(DOCUMENT_UPLOAD_FIELDS), validate({ body: documentUpdateSchema }), updateDocument);
router.delete("/:id", authorize("ADMIN", "KEPALA_SEKOLAH"), deleteDocument);

module.exports = router;

const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { uploadImage, useFirstUploadedFile, IMAGE_UPLOAD_FIELDS } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { studentCreateSchema, studentUpdateSchema } = require("../validators/schemas");
const { listStudents, createStudent, getStudent, updateStudent, deleteStudent, getStudentsOptions } = require("../controllers/students.controller");

const router = express.Router();

router.use(authMiddleware); // Semua role bisa akses students

router.get("/options", getStudentsOptions);
router.get("/", listStudents);
router.get("/:id", getStudent);
const uploadStudentPhoto = uploadImage.fields(IMAGE_UPLOAD_FIELDS.map((name) => ({ name, maxCount: 1 })));
router.post("/", uploadStudentPhoto, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: studentCreateSchema }), createStudent);
router.put("/:id", uploadStudentPhoto, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: studentUpdateSchema }), updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;

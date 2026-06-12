const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { userCreateSchema, userUpdateSchema } = require("../validators/schemas");
const { uploadImage, useFirstUploadedFile, IMAGE_UPLOAD_FIELDS } = require("../middleware/upload");
const { listUsers, createUser, getUser, updateUser, deleteUser, getTeachersOptions, uploadIdentityPhoto } = require("../controllers/users.controller");

const router = express.Router();

router.use(authMiddleware);

// Endpoint publik (semua role)
router.get("/options/teachers", getTeachersOptions);

// Endpoint terbatas (hanya Admin)
router.use(authorize("ADMIN"));
router.get("/", listUsers);
router.get("/:id", getUser);
// Support optional image upload on create/update via multipart/form-data
const imageFields = IMAGE_UPLOAD_FIELDS.map((name) => ({ name, maxCount: 1 }));
router.post("/", uploadImage.fields(imageFields), useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: userCreateSchema }), createUser);
router.put("/:id", uploadImage.fields(imageFields), useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: userUpdateSchema }), updateUser);
router.delete("/:id", deleteUser);

// Upload foto identitas. Terima beberapa field gambar umum.
router.post("/:id/photo", uploadImage.fields(imageFields), useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), uploadIdentityPhoto);

module.exports = router;

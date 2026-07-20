const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { uploadImage, useFirstUploadedFile, IMAGE_UPLOAD_FIELDS } = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { anecdoteCreateSchema, anecdoteUpdateSchema } = require("../validators/schemas");
const { listAnecdotes, createAnecdote, getAnecdote, updateAnecdote, deleteAnecdote } = require("../controllers/anecdotes.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listAnecdotes);
router.get("/:id", getAnecdote);

const uploadAnecdoteImage = uploadImage.fields(IMAGE_UPLOAD_FIELDS.map((name) => ({ name, maxCount: 1 })));
router.post("/", uploadAnecdoteImage, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: anecdoteCreateSchema }), createAnecdote);
router.put("/:id", uploadAnecdoteImage, useFirstUploadedFile(IMAGE_UPLOAD_FIELDS), validate({ body: anecdoteUpdateSchema }), updateAnecdote);
router.delete("/:id", deleteAnecdote);

module.exports = router;

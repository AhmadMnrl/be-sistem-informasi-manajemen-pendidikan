const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { questionCreateSchema, questionUpdateSchema } = require('../validators/schemas');
const { listQuestions, createQuestion, getQuestion, updateQuestion, deleteQuestion } = require('../controllers/questions.controller');

const router = express.Router();

router.use(authMiddleware); // Semua role bisa akses

router.get('/', listQuestions);
router.get('/:id', getQuestion);

// Semua role bisa write (Admin, Kepsek, Guru)
router.post('/', uploadImage.single('image'), validate({ body: questionCreateSchema }), createQuestion);
router.put('/:id', uploadImage.single('image'), validate({ body: questionUpdateSchema }), updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;

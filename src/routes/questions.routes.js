const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { questionCreateSchema, questionUpdateSchema } = require('../validators/schemas');
const { listQuestions, createQuestion, getQuestion, updateQuestion, deleteQuestion } = require('../controllers/questions.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listQuestions);

router.post('/', authorize('GURU'), uploadImage.single('image'), validate({ body: questionCreateSchema }), createQuestion);

router.get('/:id', getQuestion);

router.put('/:id', authorize('GURU'), uploadImage.single('image'), validate({ body: questionUpdateSchema }), updateQuestion);

router.delete('/:id', authorize('GURU'), deleteQuestion);

module.exports = router;

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { anecdoteCreateSchema, anecdoteUpdateSchema } = require('../validators/schemas');
const { listAnecdotes, createAnecdote, getAnecdote, updateAnecdote, deleteAnecdote } = require('../controllers/anecdotes.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listAnecdotes);

router.post('/', authorize('GURU'), uploadImage.single('image'), validate({ body: anecdoteCreateSchema }), createAnecdote);

router.get('/:id', getAnecdote);

router.put('/:id', authorize('GURU'), uploadImage.single('image'), validate({ body: anecdoteUpdateSchema }), updateAnecdote);

router.delete('/:id', authorize('GURU'), deleteAnecdote);

module.exports = router;

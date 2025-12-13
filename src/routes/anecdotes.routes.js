const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { anecdoteCreateSchema, anecdoteUpdateSchema } = require('../validators/schemas');
const { listAnecdotes, createAnecdote, getAnecdote, updateAnecdote, deleteAnecdote } = require('../controllers/anecdotes.controller');

const router = express.Router();

router.use(authMiddleware); // Semua role bisa akses

router.get('/', listAnecdotes);
router.get('/:id', getAnecdote);

// Semua role bisa write (Admin, Kepsek, Guru)
router.post('/', uploadImage.single('image'), validate({ body: anecdoteCreateSchema }), createAnecdote);
router.put('/:id', uploadImage.single('image'), validate({ body: anecdoteUpdateSchema }), updateAnecdote);
router.delete('/:id', deleteAnecdote);

module.exports = router;

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { studentCreateSchema, studentUpdateSchema } = require('../validators/schemas');
const { listStudents, createStudent, getStudent, updateStudent, deleteStudent } = require('../controllers/students.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listStudents);

router.post('/', uploadImage.single('photo'), validate({ body: studentCreateSchema }), createStudent);

router.get('/:id', getStudent);

router.put('/:id', uploadImage.single('photo'), validate({ body: studentUpdateSchema }), updateStudent);

router.delete('/:id', deleteStudent);

module.exports = router;

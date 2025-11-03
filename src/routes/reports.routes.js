const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { reportCreateSchema, reportUpdateSchema } = require('../validators/schemas');
const { listReports, createReport, getReport, updateReport, deleteReport } = require('../controllers/reports.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listReports);

router.post('/', authorize('GURU', 'ADMIN'), uploadImage.single('photo'), validate({ body: reportCreateSchema }), createReport);

router.get('/:id', getReport);

router.put('/:id', authorize('GURU', 'ADMIN'), uploadImage.single('photo'), validate({ body: reportUpdateSchema }), updateReport);

router.delete('/:id', authorize('GURU', 'ADMIN'), deleteReport);

module.exports = router;

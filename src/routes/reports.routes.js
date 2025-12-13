const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadImage } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { reportCreateSchema, reportUpdateSchema } = require('../validators/schemas');
const { listReports, createReport, getReport, updateReport, deleteReport } = require('../controllers/reports.controller');

const router = express.Router();

router.use(authMiddleware); // Semua role bisa baca

router.get('/', listReports);
router.get('/:id', getReport);

// Semua role bisa write (Admin, Kepsek, Guru)
router.post('/', uploadImage.single('photo'), validate({ body: reportCreateSchema }), createReport);
router.put('/:id', uploadImage.single('photo'), validate({ body: reportUpdateSchema }), updateReport);
router.delete('/:id', deleteReport);

module.exports = router;

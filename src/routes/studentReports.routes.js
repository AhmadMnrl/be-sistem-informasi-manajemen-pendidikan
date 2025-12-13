const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { studentReportSubmitSchema } = require('../validators/schemas');
const {
  getStudentReportDetail,
  submitStudentReport,
} = require('../controllers/studentReports.controller');

const router = express.Router();

// Detail report siswa by id
router.get('/student-reports/:id', authMiddleware, getStudentReportDetail);

// Submit jawaban siswa (menerima format answers[] atau data/Questions)
router.post('/student-reports', authMiddleware, validate(studentReportSubmitSchema, { allowUnknown: true }), submitStudentReport);

module.exports = router;
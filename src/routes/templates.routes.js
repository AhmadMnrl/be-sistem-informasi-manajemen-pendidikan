const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { templateCreateSchema } = require('../validators/schemas');
const { getActiveTemplate, createTemplateFromUi, activateTemplate } = require('../controllers/templates.controller');

const router = express.Router();

// Ambil template aktif dalam format UI
router.get('/templates/active', authMiddleware, getActiveTemplate);

// Buat template dari payload UI (opsional, untuk admin builder)
router.post('/templates', authMiddleware, validate(templateCreateSchema), createTemplateFromUi);

// Aktifkan template berdasarkan ID
router.patch('/templates/:id/activate', authMiddleware, activateTemplate);

module.exports = router;
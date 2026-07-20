const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { templateCreateSchema } = require('../validators/schemas');
const { getActiveTemplate, createTemplateFromUi, activateTemplate } = require('../controllers/templates.controller');

const router = express.Router();

router.get('/templates/active', authMiddleware, getActiveTemplate);

router.post('/templates', authMiddleware, validate({ body: templateCreateSchema }), createTemplateFromUi);

router.patch('/templates/:id/activate', authMiddleware, activateTemplate);

module.exports = router;
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { summary } = require('../controllers/summary.controller');
const { validate } = require('../middleware/validate');
const { summaryQuerySchema } = require('../validators/schemas');

const router = express.Router();

router.use(authMiddleware);
router.get('/', validate({ query: summaryQuerySchema }), summary);

module.exports = router;

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { searchAll } = require('../controllers/search.controller');
const { validate } = require('../middleware/validate');
const { searchQuerySchema } = require('../validators/schemas');

const router = express.Router();

router.use(authMiddleware);
router.get('/', validate({ query: searchQuerySchema }), searchAll);

module.exports = router;

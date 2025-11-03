const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { listLogs } = require('../controllers/logs.controller');

const router = express.Router();

router.use(authMiddleware, authorize('ADMIN'));

router.get('/', listLogs);

module.exports = router;

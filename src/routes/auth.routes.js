const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/schemas');
const { login, register, me } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', validate({ body: loginSchema }), login);

router.post('/register', authMiddleware, authorize('ADMIN'), validate({ body: registerSchema }), register);

router.get('/me', authMiddleware, me);

module.exports = router;

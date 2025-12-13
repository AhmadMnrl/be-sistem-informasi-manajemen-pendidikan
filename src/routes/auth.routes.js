const express = require('express');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../validators/schemas');
const { login } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', validate({ body: loginSchema }), login);

module.exports = router;

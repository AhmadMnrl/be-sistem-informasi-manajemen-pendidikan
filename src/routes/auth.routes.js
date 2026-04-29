const express = require("express");
const { validate } = require("../middleware/validate");
const { loginSchema } = require("../validators/schemas");
const { authMiddleware } = require("../middleware/auth");
const { login, logout } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", authMiddleware, logout);

module.exports = router;

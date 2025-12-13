const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { apeCreateSchema, apeUpdateSchema } = require('../validators/schemas');
const { listApe, createApe, getApe, updateApe, deleteApe } = require('../controllers/ape.controller');

const router = express.Router();

router.use(authMiddleware); // Semua role bisa akses (Admin, Kepsek, Guru)

router.get('/', listApe);
router.get('/:id', getApe);
router.post('/', validate({ body: apeCreateSchema }), createApe);
router.put('/:id', validate({ body: apeUpdateSchema }), updateApe);
router.delete('/:id', deleteApe);

module.exports = router;

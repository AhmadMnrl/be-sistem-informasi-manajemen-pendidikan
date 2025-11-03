const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { tapeCreateSchema, tapeUpdateSchema } = require('../validators/schemas');
const { listApe, createApe, getApe, updateApe, deleteApe } = require('../controllers/ape.controller');

const router = express.Router();

router.use(authMiddleware, authorize('ADMIN', 'KEPALA_SEKOLAH'));

router.get('/', listApe);

router.post('/', validate({ body: tapeCreateSchema }), createApe);

router.get('/:id', getApe);

router.put('/:id', validate({ body: tapeUpdateSchema }), updateApe);

router.delete('/:id', deleteApe);

module.exports = router;

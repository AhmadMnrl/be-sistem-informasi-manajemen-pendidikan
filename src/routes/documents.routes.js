const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadDocument } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { documentCreateSchema, documentUpdateSchema } = require('../validators/schemas');
const { listDocuments, createDocument, getDocument, updateDocument, deleteDocument, downloadDocument } = require('../controllers/documents.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listDocuments);

router.post('/', authorize('KEPALA_SEKOLAH', 'ADMIN'), uploadDocument.single('file'), validate({ body: documentCreateSchema }), createDocument);

router.get('/:id', getDocument);

router.put('/:id', authorize('KEPALA_SEKOLAH', 'ADMIN'), uploadDocument.single('file'), validate({ body: documentUpdateSchema }), updateDocument);

router.delete('/:id', authorize('KEPALA_SEKOLAH', 'ADMIN'), deleteDocument);

router.get('/:id/download', downloadDocument);

module.exports = router;

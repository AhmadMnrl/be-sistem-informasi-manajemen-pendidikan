const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadDocument } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { documentCreateSchema, documentUpdateSchema } = require('../validators/schemas');
const { listDocuments, createDocument, getDocument, updateDocument, deleteDocument, downloadDocument, viewDocumentFile } = require('../controllers/documents.controller');

const router = express.Router();

router.use(authMiddleware); // Semua role bisa baca

router.get('/', listDocuments);
router.get('/:id', getDocument);
router.get('/:id/download', downloadDocument);
router.get('/:id/view', viewDocumentFile);


// Hanya Admin & Kepsek yang bisa upload/update/delete
router.post('/', authorize('ADMIN', 'KEPALA_SEKOLAH'), uploadDocument.single('file'), validate({ body: documentCreateSchema }), createDocument);
router.put('/:id', authorize('ADMIN', 'KEPALA_SEKOLAH'), uploadDocument.single('file'), validate({ body: documentUpdateSchema }), updateDocument);
router.delete('/:id', authorize('ADMIN', 'KEPALA_SEKOLAH'), deleteDocument); 

module.exports = router;

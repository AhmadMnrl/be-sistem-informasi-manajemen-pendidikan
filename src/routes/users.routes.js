const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { userCreateSchema, userUpdateSchema } = require('../validators/schemas');
const { listUsers, createUser, getUser, updateUser, deleteUser } = require('../controllers/users.controller');

const router = express.Router();

router.use(authMiddleware, authorize('ADMIN'));

router.get('/', listUsers);

router.post('/', validate({ body: userCreateSchema }), createUser);

router.get('/:id', getUser);

router.put('/:id', validate({ body: userUpdateSchema }), updateUser);

router.delete('/:id', deleteUser);

module.exports = router;

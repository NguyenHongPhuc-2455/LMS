const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tuyến đường chỉ dành cho ADMIN
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getUsers);
router.get('/roles', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getRoles);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.createUser);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.updateUser);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.deleteUser);

module.exports = router;

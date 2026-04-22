const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tuyến đường cho mọi người dùng đã đăng nhập
router.get('/profile', authMiddleware.verifyToken, userController.getProfile);
router.put('/profile', authMiddleware.verifyToken, userController.updateProfile);

// Tuyến đường chỉ dành cho ADMIN
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getUsers);
router.get('/roles', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getRoles);
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.createUser);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.updateUser);
router.post('/batch-update', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.batchUpdateUsers);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.deleteUser);
router.post('/revoke-course', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.revokeCourseAccess);

module.exports = router;

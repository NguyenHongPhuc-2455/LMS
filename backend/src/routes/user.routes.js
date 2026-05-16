const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const userValidation = require('../validations/user.validation');

// Tuyến đường cho mọi người dùng đã đăng nhập
router.get('/profile', authMiddleware.verifyToken, userController.getProfile);
router.put('/profile',
    authMiddleware.verifyToken,
    validate(userValidation.updateProfile),
    userController.updateProfile
);

// Tuyến đường dành cho ADMIN và Quản lý
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdminOrStaffRead, userController.getUsers);
router.get('/roles', authMiddleware.verifyToken, authMiddleware.isAdminOrStaffRead, userController.getRoles);
router.post('/',
    authMiddleware.verifyToken,
    authMiddleware.isAdminOrManager,
    validate(userValidation.createUser),
    userController.createUser
);
router.put('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isAdminOrManager,
    validate(userValidation.updateUser),
    userController.updateUser
);
router.post('/batch-update', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, userController.batchUpdateUsers);
router.delete('/batch', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, userController.batchDeleteUsers);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, userController.deleteUser);
router.post('/:id/restore', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, userController.restoreUser);
router.patch('/:id/toggle-status', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, userController.toggleUserStatus);
router.post('/revoke-course', authMiddleware.verifyToken, authMiddleware.isAdminOrManager, userController.revokeCourseAccess);

module.exports = router;

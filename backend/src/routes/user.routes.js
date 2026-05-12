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

// Tuyến đường chỉ dành cho ADMIN
router.get('/', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getUsers);
router.get('/roles', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.getRoles);
router.post('/', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    validate(userValidation.createUser), 
    userController.createUser
);
router.put('/:id', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    validate(userValidation.updateUser), 
    userController.updateUser
);
router.post('/batch-update', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.batchUpdateUsers);
router.delete('/batch', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.batchDeleteUsers);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.deleteUser);
router.post('/revoke-course', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.revokeCourseAccess);

module.exports = router;

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const categoryValidation = require('../validations/category.validation');

// Public/Student có thể xem danh sách danh mục
router.get('/', authMiddleware.verifyToken, categoryController.getCategories);

// Chỉ Admin mới có quyền Thay đổi
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, validate(categoryValidation.createCategory), categoryController.createCategory);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, validate(categoryValidation.updateCategory), categoryController.updateCategory);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, validate(categoryValidation.deleteCategory), categoryController.deleteCategory);

module.exports = router;

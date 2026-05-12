const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Mọi người đã đăng nhập đều có thể xem danh sách phòng ban (để chọn khi đăng ký/sửa profile)
router.get('/', authMiddleware.verifyToken, departmentController.getDepartments);

// Chỉ Admin mới có quyền CRUD
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, departmentController.createDepartment);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, departmentController.updateDepartment);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, departmentController.deleteDepartment);

module.exports = router;

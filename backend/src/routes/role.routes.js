const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tất cả các tuyến đường này đều yêu cầu đăng nhập
router.use(authMiddleware.verifyToken);

// Lấy danh sách vai trò (Admin, Manager, Lecturer đều có thể xem)
router.get('/', authMiddleware.isAdminOrStaffRead, roleController.getRoles);

// Các thao tác thay đổi dữ liệu CHỈ dành cho Admin
router.post('/', authMiddleware.isAdmin, roleController.createRole);
router.put('/:id', authMiddleware.isAdmin, roleController.updateRole);
router.delete('/:id', authMiddleware.isAdmin, roleController.deleteRole);

module.exports = router;

const express = require('express');
const router = express.Router();
const managerController = require('../controllers/manager.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Bảo mật toàn bộ phân hệ Manager: bắt buộc đăng nhập và phải có role 'manager' hoặc 'admin'
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.authorize(['manager', 'admin']));

// 1. Xem nhân viên thuộc phòng ban mình
router.get('/employees', managerController.getEmployees);

// 2. Xem danh sách khóa học và tiến độ chi tiết của một nhân viên cụ thể
router.get('/employees/:id/progress', managerController.getEmployeeProgress);

// 3. Xem báo cáo các nhân sự phòng mình không học tập (Báo cáo Inactive)
router.get('/reports/inactive', managerController.getInactiveEmployees);

// 4. Gửi nhắc nhở học tập trực tiếp cho nhân viên trong phòng ban
router.post('/reminders', managerController.sendReminder);

module.exports = router;

const express = require('express');
const router = express.Router();
const courseRequestController = require('../controllers/courseRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tất cả route đều yêu cầu đăng nhập
router.use(authMiddleware.verifyToken);

// User routes
router.post('/', courseRequestController.requestAccess);
router.get('/my-requests', courseRequestController.getMyRequests);

// Admin routes - Chỉ Admin mới có quyền phê duyệt/từ chối
router.get('/pending', authMiddleware.isAdmin, courseRequestController.getPendingRequests);
router.post('/approve-bulk', authMiddleware.isAdmin, courseRequestController.approveBulk);
router.post('/reject-bulk', authMiddleware.isAdmin, courseRequestController.rejectBulk);
router.patch('/:id/approve', authMiddleware.isAdmin, courseRequestController.approveRequest);
router.patch('/:id/reject', authMiddleware.isAdmin, courseRequestController.rejectRequest);


module.exports = router;

const express = require('express');
const router = express.Router();
const courseRequestController = require('../controllers/courseRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const courseRequestValidation = require('../validations/courseRequest.validation');

// Tất cả route đều yêu cầu đăng nhập
router.use(authMiddleware.verifyToken);

// User routes
router.post('/', validate(courseRequestValidation.requestAccess), courseRequestController.requestAccess);
router.get('/my-requests', courseRequestController.getMyRequests);

// Admin routes - Chỉ Admin mới có quyền phê duyệt/từ chối
router.get('/pending', authMiddleware.isAdmin, courseRequestController.getPendingRequests);
router.post('/approve-bulk', authMiddleware.isAdmin, validate(courseRequestValidation.bulkAction), courseRequestController.approveBulk);
router.post('/reject-bulk', authMiddleware.isAdmin, validate(courseRequestValidation.bulkAction), courseRequestController.rejectBulk);
router.patch('/:id/approve', authMiddleware.isAdmin, courseRequestController.approveRequest);
router.patch('/:id/reject', authMiddleware.isAdmin, courseRequestController.rejectRequest);


module.exports = router;

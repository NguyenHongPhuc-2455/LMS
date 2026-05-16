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

// Admin/Manager routes - Phê duyệt/từ chối yêu cầu
router.get('/pending', authMiddleware.isAdminOrManager, courseRequestController.getPendingRequests);
router.post('/approve-bulk', authMiddleware.isAdminOrManager, validate(courseRequestValidation.bulkAction), courseRequestController.approveBulk);
router.post('/reject-bulk', authMiddleware.isAdminOrManager, validate(courseRequestValidation.bulkAction), courseRequestController.rejectBulk);
router.patch('/:id/approve', authMiddleware.isAdminOrManager, courseRequestController.approveRequest);
router.patch('/:id/reject', authMiddleware.isAdminOrManager, courseRequestController.rejectRequest);


module.exports = router;

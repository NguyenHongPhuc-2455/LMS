const express = require('express');
const router = express.Router();
const courseRequestController = require('../controllers/courseRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tất cả route đều yêu cầu đăng nhập
router.use(authMiddleware.verifyToken);

// User routes
router.post('/', courseRequestController.requestAccess);
router.get('/my-requests', courseRequestController.getMyRequests);

// Admin/Manager routes (Giả sử có middleware check admin)
// router.use(authMiddleware.restrictTo('admin', 'manager'));
router.get('/pending', courseRequestController.getPendingRequests);
router.patch('/:id/approve', courseRequestController.approveRequest);
router.patch('/:id/reject', courseRequestController.rejectRequest);

module.exports = router;

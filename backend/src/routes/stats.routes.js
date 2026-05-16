const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Thống kê cho admin và quản lý (Staff)
router.get('/dashboard', authMiddleware.verifyToken, authMiddleware.isAdminOrStaffRead, statsController.getDashboardStats);
router.get('/course-progress/:courseId', authMiddleware.verifyToken, authMiddleware.isAdminOrStaffRead, statsController.getCourseProgress);
router.get('/progress-search', authMiddleware.verifyToken, authMiddleware.isAdminOrStaffRead, statsController.searchProgress);
router.get('/global-learning-trends', authMiddleware.verifyToken, authMiddleware.isAdminOrStaffRead, statsController.getGlobalLearningTrends);

// APIs cho học viên
router.post('/track', authMiddleware.verifyToken, statsController.trackLearningTime);
router.get('/my-learning-time', authMiddleware.verifyToken, statsController.getMyLearningStats);
router.get('/my-learning-summary', authMiddleware.verifyToken, statsController.getMyLearningSummary);
router.get('/top-learners', authMiddleware.verifyToken, statsController.getTopLearners);

module.exports = router;

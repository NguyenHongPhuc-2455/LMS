const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Chỉ cho phép admin xem thống kê tổng quát
router.get('/dashboard', authMiddleware.verifyToken, authMiddleware.isAdmin, statsController.getDashboardStats);
router.get('/course-progress/:courseId', authMiddleware.verifyToken, authMiddleware.isAdmin, statsController.getCourseProgress);
router.get('/progress-search', authMiddleware.verifyToken, authMiddleware.isAdmin, statsController.searchProgress);
router.get('/global-learning-trends', authMiddleware.verifyToken, authMiddleware.isAdmin, statsController.getGlobalLearningTrends);

// APIs cho học viên
router.post('/track', authMiddleware.verifyToken, statsController.trackLearningTime);
router.get('/my-learning-time', authMiddleware.verifyToken, statsController.getMyLearningStats);
router.get('/my-learning-summary', authMiddleware.verifyToken, statsController.getMyLearningSummary);
router.get('/top-learners', authMiddleware.verifyToken, statsController.getTopLearners);

module.exports = router;

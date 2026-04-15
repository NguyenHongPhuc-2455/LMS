const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Chỉ cho phép admin xem thống kê
router.get('/dashboard', authMiddleware.verifyToken, authMiddleware.isAdmin, statsController.getDashboardStats);

module.exports = router;

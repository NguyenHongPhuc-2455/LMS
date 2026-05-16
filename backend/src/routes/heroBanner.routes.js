const express = require('express');
const router = express.Router();
const heroBannerController = require('../controllers/heroBanner.controller');
const { verifyToken, isAdmin, isAdminOrManager, isAdminOrStaffRead } = require('../middlewares/auth.middleware');

// Public route to get active banners
router.get('/', heroBannerController.getBanners);

// Admin/Manager routes to manage banners
router.get('/admin', verifyToken, isAdminOrStaffRead, heroBannerController.getAdminBanners);
router.post('/', verifyToken, isAdminOrManager, heroBannerController.createBanner);
router.put('/:id', verifyToken, isAdminOrManager, heroBannerController.updateBanner);
router.delete('/:id', verifyToken, isAdminOrManager, heroBannerController.deleteBanner);

module.exports = router;

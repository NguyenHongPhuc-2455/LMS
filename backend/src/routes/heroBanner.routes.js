const express = require('express');
const router = express.Router();
const heroBannerController = require('../controllers/heroBanner.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Public route to get active banners
router.get('/', heroBannerController.getBanners);

// Admin routes to manage banners
router.post('/', verifyToken, isAdmin, heroBannerController.createBanner);
router.put('/:id', verifyToken, isAdmin, heroBannerController.updateBanner);
router.delete('/:id', verifyToken, isAdmin, heroBannerController.deleteBanner);

module.exports = router;

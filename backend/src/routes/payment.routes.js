const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/buy', authMiddleware.verifyToken, paymentController.buyCourse);
router.post('/create-vnpay-url', authMiddleware.verifyToken, paymentController.createVnpayUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);
router.get('/my-courses', authMiddleware.verifyToken, paymentController.getMyCourses);

module.exports = router;

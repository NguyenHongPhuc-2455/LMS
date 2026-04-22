const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const authValidation = require('../validations/auth.validation');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
router.post('/refresh', authController.refresh);

module.exports = router;

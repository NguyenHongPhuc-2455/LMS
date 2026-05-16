const express = require('express');
const router = express.Router();
const prisma = require('../configs/prisma');
const authMiddleware = require('../middlewares/auth.middleware');
const catchAsync = require('../utils/catchAsync');

const sectionController = require('../controllers/section.controller');

/**
 * Lấy danh sách bài giảng của một chương
 * GET /api/sections/:sectionId/lessons
 */
router.get('/:sectionId/lessons', authMiddleware.verifyToken, sectionController.getLessonsBySection);

module.exports = router;

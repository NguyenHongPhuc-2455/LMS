const express = require('express');
const router = express.Router();
const prisma = require('../configs/prisma');
const authMiddleware = require('../middlewares/auth.middleware');
const catchAsync = require('../utils/catchAsync');

/**
 * Lấy danh sách bài giảng của một chương
 * GET /api/sections/:sectionId/lessons
 */
router.get('/:sectionId/lessons', authMiddleware.verifyToken, catchAsync(async (req, res) => {
    const { sectionId } = req.params;

    // Tìm section và include lessons
    const section = await prisma.section.findUnique({
        where: { id: parseInt(sectionId) },
        include: {
            lessons: {
                orderBy: [
                    { order: 'asc' },
                    { id: 'asc' }
                ]
            }
        }
    });

    if (!section) {
        return res.status(404).json({ error: 'Không tìm thấy chương học' });
    }

    // Trả về chỉ mảng lessons như frontend mong đợi
    res.json(section.lessons);
}));

module.exports = router;

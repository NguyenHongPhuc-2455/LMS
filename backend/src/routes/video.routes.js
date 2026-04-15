const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/video.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const upload = multer({ dest: 'uploads/' });

router.get('/', authMiddleware.verifyToken, videoController.getVideos);

// Upload video cho một Lesson cụ thể
router.post('/upload', authMiddleware.verifyToken, upload.single('video'), videoController.uploadVideo);

// Upload tài liệu (PDF) đính kèm cho bài học
router.post('/upload-attachment/:lessonId', authMiddleware.verifyToken, upload.single('attachment'), videoController.uploadAttachment);

// Lấy chìa khóa giải mã (Lesson-based)
router.get('/key/:lessonId', authMiddleware.verifyToken, videoController.getVideoKey);

// Đánh dấu hoàn thành bài học
router.post('/complete/:lessonId', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const prisma = require('../configs/prisma');
        await prisma.lessonCompleted.upsert({
            where: { user_id_lesson_id: { user_id: userId, lesson_id: parseInt(lessonId) } },
            update: { completed_at: new Date() },
            create: { user_id: userId, lesson_id: parseInt(lessonId) }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id', authMiddleware.verifyToken, videoController.updateLesson);
router.delete('/:id', authMiddleware.verifyToken, videoController.deleteVideo);

module.exports = router;

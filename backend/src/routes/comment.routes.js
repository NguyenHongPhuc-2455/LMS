const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Lấy danh sách bình luận (Công khai hoặc cần login tùy design, ở đây cho phép public xem)
router.get('/lesson/:lessonId', commentController.getLessonComments);

// Gửi bình luận (Cần login)
router.post('/', authMiddleware.verifyToken, commentController.createComment);

// Xóa bình luận (Cần login)
router.delete('/:id', authMiddleware.verifyToken, commentController.deleteComment);

module.exports = router;

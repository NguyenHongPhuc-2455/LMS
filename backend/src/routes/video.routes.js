const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/video.controller');
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const lessonValidation = require('../validations/lesson.validation');

const upload = multer({ dest: 'uploads/' });

router.get('/', authMiddleware.verifyToken, videoController.getVideos);
router.get('/manifest/:id', authMiddleware.verifyToken, videoController.getManifest);

// Quản lý Video/Bài học (Chỉ Instructor/Admin)
router.post('/upload', authMiddleware.verifyToken, authMiddleware.isInstructor, upload.single('video'), videoController.uploadVideo);
router.post('/upload-attachment/:lessonId', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.getByLessonId), upload.single('attachment'), videoController.uploadAttachment);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.updateLesson), videoController.updateLesson);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.getById), videoController.deleteVideo);

// Lấy chìa khóa giải mã (Lesson-based)
router.get('/key/:lessonId', authMiddleware.verifyToken, validate(lessonValidation.getByLessonId), videoController.getVideoKey);

// Đánh dấu hoàn thành bài học (Mọi Student/User)
router.post('/complete/:lessonId', authMiddleware.verifyToken, validate(lessonValidation.getByLessonId), courseController.completeLesson);

// Quét lại thông tin thời lượng
router.post('/reprobe/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.getById), videoController.reprobeVideo);

module.exports = router;

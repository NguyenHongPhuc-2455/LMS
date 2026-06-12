const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/video.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const lessonValidation = require('../validations/lesson.validation');

const upload = multer({ dest: 'uploads/' });
router.get('/', authMiddleware.verifyToken, authMiddleware.isInstructor, videoController.getVideos);
router.get('/manifest/:id', authMiddleware.verifyToken, videoController.getManifest);
router.get(/^\/stream\/([^/]+)\/(.+)$/, (req, res, next) => {
    // Map regex captures to req.params for controller compatibility
    req.params.token = req.params[0];
    req.params.filePath = req.params[1];
    next();
}, videoController.streamProxy);

router.get('/secure-stream/:token', videoController.secureStream);
router.get('/refresh-stream/:lessonId', authMiddleware.verifyToken, videoController.refreshStreamToken);

// Quản lý Video/Bài học (Chỉ Instructor/Admin)
router.post('/upload', authMiddleware.verifyToken, authMiddleware.isInstructor, upload.single('video'), videoController.uploadVideo);
router.post('/upload-attachment/:lessonId', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.getByLessonId), upload.single('attachment'), videoController.uploadAttachment);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.updateLesson), videoController.updateLesson);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.getById), videoController.deleteVideo);

// Lấy chìa khóa giải mã (Lesson-based)
router.get('/key/:lessonId', authMiddleware.verifyToken, validate(lessonValidation.getByLessonId), videoController.getVideoKey);

// Đánh dấu hoàn thành bài học (Mọi Student/User)
router.post('/complete/:lessonId', authMiddleware.verifyToken, validate(lessonValidation.getByLessonId), enrollmentController.completeLesson);

// Quét lại thông tin thời lượng
router.post('/reprobe/:id', authMiddleware.verifyToken, authMiddleware.isInstructor, validate(lessonValidation.getById), videoController.reprobeVideo);

module.exports = router;

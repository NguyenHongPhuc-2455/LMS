const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/video.controller');
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const lessonValidation = require('../validations/lesson.validation');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../configs/cloudinary.config');

const upload = multer({ dest: 'uploads/' });

// Cấu hình Cloudinary cho tài liệu đính kèm (PDF, DOCX...)
const attachmentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'security_video_attachments',
        resource_type: 'raw',
        public_id: (req, file) => {
            // Loại bỏ khoảng trắng và ký tự đặc biệt để tránh lỗi URL (401/404)
            const cleanName = file.originalname.replace(/\s+/g, '_');
            return `attachment-${Date.now()}-${cleanName}`;
        },
    },
});
const attachmentUpload = multer({ storage: attachmentStorage });
router.get('/', authMiddleware.verifyToken, authMiddleware.isInstructor, videoController.getVideos);
router.get('/manifest/:id', authMiddleware.verifyToken, videoController.getManifest);
router.get(/^\/stream\/([^/]+)\/(.+)$/, (req, res, next) => {
    // Map regex captures to req.params for controller compatibility
    req.params.token = req.params[0];
    req.params.filePath = req.params[1];
    next();
}, videoController.streamProxy);

router.get('/secure-stream/:token', authMiddleware.verifyToken, videoController.secureStream);
router.get('/refresh-stream/:lessonId', authMiddleware.verifyToken, videoController.refreshStreamToken);

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

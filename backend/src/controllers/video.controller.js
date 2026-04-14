const prisma = require('../configs/prisma');
const videoService = require('../services/video.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Upload và bắt đầu xử lý Video
 */
exports.uploadVideo = catchAsync(async (req, res) => {
    const { title, section_id } = req.body;

    if (!req.file) throw new ApiError(400, 'Please upload a video file');
    if (!section_id) throw new ApiError(400, 'Section ID is required');

    const lesson = await prisma.lesson.create({
        data: {
            title,
            section_id: parseInt(section_id),
            type: 'VIDEO'
        }
    });

    // Chạy ngầm trong background
    videoService.processVideoToHLS(lesson.id, req.file.path);

    res.status(202).json({
        status: 'success',
        message: 'Video is being processed...',
        data: { lessonId: lesson.id }
    });
});

/**
 * Lấy danh sách tất cả bài học video
 */
exports.getVideos = catchAsync(async (req, res) => {
    const lessons = await videoService.getVideos();
    res.json({
        status: 'success',
        data: lessons
    });
});

/**
 * Endpoint cung cấp Key cho trình phát video (Đã qua Auth Middleware)
 */
exports.getVideoKey = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const key = await videoService.getVideoKey(lessonId);

    res.set('Content-Type', 'application/octet-stream');
    res.set('Cache-Control', 'no-store');
    res.send(key);
});

/**
 * Xóa video
 */
exports.deleteVideo = catchAsync(async (req, res) => {
    const { id } = req.params;

    // 1. Xóa folder video vật lý
    await videoService.deleteVideoFiles(id);

    // 2. Xóa trong database
    await prisma.lesson.delete({ where: { id: parseInt(id) } });

    res.json({
        status: 'success',
        message: 'Video deleted'
    });
});

/**
 * Cập nhật thông tin bài học
 */
exports.updateLesson = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, section_id } = req.body;

    const lesson = await prisma.lesson.update({
        where: { id: parseInt(id) },
        data: {
            title,
            section_id: section_id ? parseInt(section_id) : undefined
        }
    });

    res.json({
        status: 'success',
        data: lesson
    });
});

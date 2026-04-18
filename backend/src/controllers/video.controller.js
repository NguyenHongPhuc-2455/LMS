const fs = require('fs');
const path = require('path');
const prisma = require('../configs/prisma');
const videoService = require('../services/video.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Upload và bắt đầu xử lý Video
 */
exports.uploadVideo = catchAsync(async (req, res) => {
    const { title, section_id, order, video_url } = req.body;

    if (!req.file && !video_url) throw new ApiError(400, 'Please upload a video file or provide a video URL');
    if (!section_id) throw new ApiError(400, 'Section ID is required');

    const lesson = await prisma.lesson.create({
        data: {
            title,
            section_id: parseInt(section_id),
            type: 'VIDEO',
            order: order ? parseInt(order) : 0,
            video_url: video_url || null // Set URL right away if they passed string
        }
    });

    if (req.file) {
        // Chạy ngầm trong background
        videoService.processVideoToHLS(lesson.id, req.file.path);

        return res.status(202).json({
            status: 'success',
            message: 'Video is being processed...',
            data: { lessonId: lesson.id }
        });
    }

    res.status(201).json({
        status: 'success',
        message: 'Video lesson created successfully via Link',
        data: { lessonId: lesson.id, video_url }
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
    const { title, section_id, content, order } = req.body;

    const lesson = await prisma.lesson.update({
        where: { id: parseInt(id) },
        data: {
            title,
            section_id: section_id ? parseInt(section_id) : undefined,
            content,
            order: order !== undefined ? parseInt(order) : undefined
        }
    });

    res.json({
        status: 'success',
        data: lesson
    });
});

/**
 * Upload tài liệu đính kèm cho bài học
 */
exports.uploadAttachment = catchAsync(async (req, res) => {
    const { lessonId } = req.params;

    if (!req.file) throw new ApiError(400, 'Vui lòng chọn tệp đính kèm');

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const destinationPath = path.join(__dirname, '../../public/attachments', fileName);

    // Di chuyển file từ temp upload sang thư mục chính
    fs.renameSync(req.file.path, destinationPath);

    const attachmentUrl = `/public/attachments/${fileName}`;

    const lesson = await prisma.lesson.update({
        where: { id: parseInt(lessonId) },
        data: {
            attachment_url: attachmentUrl,
            attachment_name: req.file.originalname
        }
    });

    res.json({
        status: 'success',
        message: 'Tài liệu đã được tải lên thành công',
        data: lesson
    });
});

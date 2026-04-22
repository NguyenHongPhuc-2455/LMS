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
    const { title, section_id, order, video_url, content } = req.body;

    if (!req.file && !video_url) throw new ApiError(400, 'Please upload a video file or provide a video URL');
    if (!section_id) throw new ApiError(400, 'Section ID is required');

    const lesson = await prisma.lesson.create({
        data: {
            title,
            section_id: parseInt(section_id),
            type: 'VIDEO',
            content: content || null,
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

    if (video_url) {
        // Theo yêu cầu mới: Link Youtube/Server chỉ hiển thị bình thường, không băm.
        await prisma.lesson.update({
            where: { id: lesson.id },
            data: {
                video_url: video_url,
                source_url: null // Đảm bảo không nhầm lẫn với cơ chế băm
            }
        });

        return res.status(201).json({
            status: 'success',
            message: 'Video lesson created successfully via Link',
            data: { lessonId: lesson.id, video_url }
        });
    }

    res.status(201).json({
        status: 'success',
        message: 'Lesson created',
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
    if (isNaN(parseInt(lessonId))) throw new ApiError(400, 'Invalid lesson ID');
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
    if (isNaN(parseInt(id))) throw new ApiError(400, 'Invalid lesson ID');

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
/**
 * Endpoint phục vụ file Manifest .m3u8 (Có kiểm tra On-demand Transcoding)
 */
exports.getManifest = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Đảm bảo HLS đã sẵn sàng
    const isReady = await videoService.ensureHLS(id);

    // Nếu chưa sẵn sàng ngay lập tức (đang băm ngầm), 
    // lý tưởng nhất là trả về loading hoặc một list trống.
    // Tuy nhiên FFmpeg băm khá nhanh master.m3u8, ta sẽ đợi một chút hoặc serve trực tiếp.

    const manifestPath = path.join(__dirname, `../../public/hls/${id}/master.m3u8`);

    // Đợi tối đa 5s cho master.m3u8 xuất hiện nếu đang băm
    if (!isReady) {
        let attempts = 0;
        while (!fs.existsSync(manifestPath) && attempts < 10) {
            await new Promise(r => setTimeout(r, 500));
            attempts++;
        }
    }

    if (!fs.existsSync(manifestPath)) {
        return res.status(202).json({
            status: 'processing',
            message: 'Video is being transcoded, please retry in a few seconds'
        });
    }

    res.sendFile(manifestPath);
});

exports.updateLesson = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) throw new ApiError(400, 'Invalid lesson ID');
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
    if (isNaN(parseInt(lessonId))) throw new ApiError(400, 'Invalid lesson ID');

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

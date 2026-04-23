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
    const { title, section_id, order, video_url, content, duration: manualDuration } = req.body;

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
        // Nếu là Link trực tiếp (không phải Youtube), thử lấy duration
        let duration = manualDuration ? parseInt(manualDuration) : 0;
        const isYoutube = video_url.includes('youtube.com') || video_url.includes('youtu.be');

        if (!duration && !isYoutube) {
            duration = await videoService.getDuration(video_url);
        }

        await prisma.lesson.update({
            where: { id: lesson.id },
            data: {
                video_url: video_url,
                duration: duration,
                source_url: null
            }
        });

        return res.status(201).json({
            status: 'success',
            message: 'Video lesson created successfully via Link',
            data: { lessonId: lesson.id, video_url, duration }
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
    const userId = req.user.id;
    const roles = req.user.roles || [];

    if (isNaN(parseInt(lessonId))) throw new ApiError(400, 'Invalid lesson ID');

    // 1. Lấy thông tin bài học và khóa học tương ứng
    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: {
            section: {
                select: { course_id: true }
            }
        }
    });

    if (!lesson) throw new ApiError(404, 'Không tìm thấy bài học');

    const courseId = lesson.section.course_id;

    // 2. Kiểm tra quyền truy cập
    // Bài học miễn phí hoặc User là Admin/Instructor thì cho phép luôn
    const isSpecialUser = roles.includes('admin') || roles.includes('instructor');

    if (!lesson.is_free && !isSpecialUser) {
        // Kiểm tra Enrollment (Trực tiếp hoặc qua Program)
        const [enrollment, programEnrollment] = await Promise.all([
            prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: userId, course_id: courseId } }
            }),
            prisma.programEnrollment.findFirst({
                where: {
                    user_id: userId,
                    program: {
                        courses: {
                            some: { course_id: courseId }
                        }
                    }
                }
            })
        ]);

        if (!enrollment && !programEnrollment) {
            throw new ApiError(403, 'Bạn chưa có quyền truy cập video này. Vui lòng đăng ký khóa học.');
        }
    }

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
    const { title, section_id, content, order, duration } = req.body;

    const lesson = await prisma.lesson.update({
        where: { id: parseInt(id) },
        data: {
            title,
            section_id: section_id ? parseInt(section_id) : undefined,
            content,
            order: order !== undefined ? parseInt(order) : undefined,
            duration: duration !== undefined ? parseInt(duration) : undefined
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

/**
 * Quét lại thông tin thời lượng (Re-probe)
 */
exports.reprobeVideo = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) throw new ApiError(400, 'Invalid lesson ID');

    const lesson = await prisma.lesson.findUnique({ where: { id: parseInt(id) } });
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    // Xác định nguồn để quét
    const source = lesson.source_url || lesson.video_url;
    if (!source || source.includes('youtube.com') || source.includes('youtu.be')) {
        throw new ApiError(400, 'Cannot reprobe YouTube videos. Please update duration manually.');
    }

    // Nếu là file vật lý cục bộ thì cần map lại path
    let probePath = source;
    if (source.startsWith('/public/hls/')) {
        // HLS playlist might not give good duration for some ffprobe versions, 
        // better use a segment or the master if it contains duration tags.
        probePath = path.join(__dirname, '../../', source);
    }

    const duration = await videoService.getDuration(probePath);

    const updated = await prisma.lesson.update({
        where: { id: parseInt(id) },
        data: { duration }
    });

    res.json({
        status: 'success',
        message: 'Re-probe successful',
        data: { duration: updated.duration }
    });
});

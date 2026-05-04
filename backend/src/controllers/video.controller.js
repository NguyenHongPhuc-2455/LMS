const fs = require('fs');
const path = require('path');
const prisma = require('../configs/prisma');
const videoService = require('../services/video.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { verifyStreamToken } = require('../utils/streamToken');
const { decodeVideoToken, createVideoToken } = require('../utils/crypto');
const axios = require('axios');
const cloudinary = require('../configs/cloudinary.config');
const { getFileStream, uploadFile, R2_PUBLIC_URL } = require('../utils/r2Storage');

/**
 * Upload và bắt đầu xử lý Video
 */
exports.uploadVideo = catchAsync(async (req, res) => {
    const { title, section_id, order, video_url, content, duration: manualDuration, anti_seek, attachment_url } = req.body;

    if (!req.file && !video_url) throw new ApiError(400, 'Please upload a video file or provide a video URL');
    if (!section_id) throw new ApiError(400, 'Section ID is required');

    const lesson = await prisma.lesson.create({
        data: {
            title,
            section_id: parseInt(section_id),
            type: 'VIDEO',
            content: content || null,
            order: order ? parseInt(order) : 0,
            video_url: video_url || null,
            anti_seek: anti_seek !== undefined ? Boolean(anti_seek) : true,
            attachment_url: attachment_url || null,
            attachment_name: attachment_url ? 'Document' : null
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

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(id) },
        select: { video_url: true }
    });

    if (lesson && lesson.video_url && lesson.video_url.includes('cloudinary')) {
        return res.redirect(lesson.video_url);
    }

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
    const { title, section_id, content, order, duration, anti_seek, attachment_url, attachment_name } = req.body;

    const lesson = await prisma.lesson.update({
        where: { id: parseInt(id) },
        data: {
            title,
            section_id: section_id ? parseInt(section_id) : undefined,
            content,
            order: order !== undefined ? parseInt(order) : undefined,
            duration: duration !== undefined ? parseInt(duration) : undefined,
            anti_seek: anti_seek !== undefined ? Boolean(anti_seek) : undefined,
            attachment_url: attachment_url !== undefined ? attachment_url : undefined,
            attachment_name: attachment_name !== undefined ? attachment_name : undefined
        },
        select: videoService.lessonSelect
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

    try {
        // Làm sạch tên file: xóa dấu, khoảng trắng và ký tự lạ
        const cleanName = req.file.originalname
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '');

        const publicId = `attachment-${Date.now()}-${cleanName}`;

        // Upload thủ công lên Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'security_video_attachments',
            resource_type: 'raw',
            public_id: publicId
        });

        // Xóa file tạm sau khi upload
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const attachmentUrl = result.secure_url;

        const lesson = await prisma.lesson.update({
            where: { id: parseInt(lessonId) },
            data: {
                attachment_url: attachmentUrl,
                attachment_name: req.file.originalname
            },
            select: videoService.lessonSelect
        });

        res.json({
            status: 'success',
            message: 'Tài liệu đã được tải lên thành công',
            data: lesson
        });
    } catch (error) {
        // Đảm bảo xóa file tạm nếu lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw new ApiError(500, `Lỗi upload tài liệu: ${error.message}`);
    }
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

/**
 * Proxy stream HLS an toàn - Stream file từ Cloudflare R2
 */
exports.streamProxy = catchAsync(async (req, res) => {
    let { token, filePath } = req.params;

    try {
        if (Array.isArray(filePath)) filePath = filePath.join('/');
        if (!filePath) filePath = 'stream.m3u8';

        const payload = verifyStreamToken(token);
        if (!payload) {
            return res.status(403).json({ error: 'Token stream không hợp lệ hoặc đã hết hạn.' });
        }

        if (payload.clientIp && payload.clientIp !== req.ip) {
            return res.status(403).json({ error: 'Token này được tạo cho một địa chỉ IP khác. Cần đồng bộ lại.' });
        }

        const { lessonId } = payload;
        const safeFilePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const r2Key = `hls/${lessonId}/${safeFilePath}`;

        console.log(`[STREAM R2] Lesson: ${lessonId}, Key: ${r2Key}`);

        // Xác định Content-Type
        const contentType = safeFilePath.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : safeFilePath.endsWith('.ts')
                ? 'video/mp2t'
                : 'application/octet-stream';

        // Headers CORS & Security
        const origin = req.headers.origin;
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Content-Type', contentType);

        // Lấy file từ R2 và pipe về client
        try {
            const r2Response = await getFileStream(r2Key);
            r2Response.Body.pipe(res);
            r2Response.Body.on('error', (err) => {
                console.error('[STREAM R2 ERROR] Pipe error:', err.message);
                res.end();
            });
        } catch (r2Err) {
            // Fallback: thử đọc từ local disk nếu có
            const physicalPath = path.resolve(__dirname, '../../public/hls', String(lessonId), safeFilePath);
            if (fs.existsSync(physicalPath)) {
                console.log(`[STREAM LOCAL FALLBACK] ${physicalPath}`);
                return res.sendFile(physicalPath);
            }
            console.error(`[STREAM ERROR] File not found in R2 or local: ${r2Key}`);
            return res.status(404).send('Video file not found');
        }
    } catch (err) {
        console.error('[STREAM FATAL ERROR]', err);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * Proxy stream bất kỳ qua Token AES (Dùng cho cả Cloudinary hoặc Server ngoài)
 */
exports.secureStream = catchAsync(async (req, res) => {
    const { token } = req.params;

    // 1. Giải mã URL gốc + kiểm tra thời hạn và IP
    const originalUrl = decodeVideoToken(token, req.ip);
    if (!originalUrl) {
        return res.status(403).json({
            error: 'Token video không hợp lệ, đã hết hạn, hoặc IP không khớp. Vui lòng tải lại trang.'
        });
    }

    console.log(`[SECURE STREAM] Proxying: ${originalUrl}`);

    try {
        // 2. Chuyển tiếp Request với các headers cần thiết (đặc biệt là Range cho MP4)
        const headers = {};
        if (req.headers.range) {
            headers.range = req.headers.range;
        }

        const response = await axios({
            method: 'get',
            url: originalUrl,
            responseType: 'stream',
            headers: headers,
            timeout: 30000 // 30s timeout
        });

        // 3. Chuyển tiếp các headers quan trọng từ nguồn về client
        res.set({
            'Content-Type': response.headers['content-type'],
            'Content-Length': response.headers['content-length'],
            'Accept-Ranges': response.headers['accept-ranges'] || 'bytes',
            'Content-Range': response.headers['content-range'],
            'Cache-Control': 'no-cache'
        });

        if (response.status === 206) {
            res.status(206);
        }

        // 4. Pipe stream
        response.data.pipe(res);

        // Xử lý lỗi pipe
        response.data.on('error', (err) => {
            console.error('[SECURE STREAM ERROR] Stream error:', err);
            res.end();
        });

        req.on('close', () => {
            // Hủy request tới nguồn nếu client ngắt kết nối
            if (response.data && response.data.destroy) {
                response.data.destroy();
            }
        });

    } catch (error) {
        console.error('[SECURE STREAM ERROR]', error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.statusText);
        } else {
            res.status(500).send('Internal Server Error while streaming');
        }
    }
});

/**
 * Làm mới token stream cho một bài học (yêu cầu xác thực)
 * Frontend gọi endpoint này trước khi token cũ hết hạn
 */
exports.refreshStreamToken = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const roles = req.user.roles || [];

    if (isNaN(parseInt(lessonId))) throw new ApiError(400, 'Invalid lesson ID');

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        select: {
            video_url: true,
            is_free: true,
            section: { select: { course_id: true } }
        }
    });

    if (!lesson || !lesson.video_url) throw new ApiError(404, 'Bài học hoặc URL video không tồn tại');

    // Kiểm tra quyền truy cập
    const isSpecialUser = roles.includes('admin') || roles.includes('instructor');
    if (!lesson.is_free && !isSpecialUser) {
        const courseId = lesson.section.course_id;
        const [enrollment, programEnrollment] = await Promise.all([
            prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: userId, course_id: courseId } }
            }),
            prisma.programEnrollment.findFirst({
                where: {
                    user_id: userId,
                    program: { courses: { some: { course_id: courseId } } }
                }
            })
        ]);
        if (!enrollment && !programEnrollment) {
            throw new ApiError(403, 'Bạn chưa có quyền truy cập video này');
        }
    }

    // Tạo token mới với IP hiện tại và TTL 5 phút
    const newToken = createVideoToken(lesson.video_url, req.ip);
    const videoUrl = `/api/videos/secure-stream/${encodeURIComponent(newToken)}`;

    res.json({ videoUrl });
});

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
    const { title, section_id, order, video_url, hls_video_url, content, duration: manualDuration, anti_seek, attachment_url } = req.body;

    if (!req.file && !video_url && !hls_video_url) throw new ApiError(400, 'Please upload a video file or provide a video URL');
    if (!section_id) throw new ApiError(400, 'Section ID is required');

    const lesson = await prisma.lesson.create({
        data: {
            title,
            section_id: parseInt(section_id),
            type: 'VIDEO',
            content: content || null,
            order: order ? parseInt(order) : 0,
            video_url: video_url || null,
            anti_seek: anti_seek !== undefined ? (anti_seek === 'false' ? false : Boolean(anti_seek)) : true,
            attachment_url: attachment_url || null,
            attachment_name: attachment_url ? 'Document' : null
        }
    });

    if (req.file || hls_video_url) {
        const sourcePath = req.file ? req.file.path : hls_video_url;
        videoService.processVideoToHLS(lesson.id, sourcePath);
        return res.status(202).json({
            status: 'success',
            message: 'Video is being processed...',
            data: { lessonId: lesson.id }
        });
    }

    if (video_url) {
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
 * Xóa video
 */
exports.deleteVideo = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) throw new ApiError(400, 'Invalid lesson ID');
    await videoService.deleteVideoFiles(id);
    await prisma.lesson.delete({ where: { id: parseInt(id) } });
    res.json({ status: 'success', message: 'Video deleted' });
});

/**
 * Cập nhật thông tin bài học
 */
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
            anti_seek: anti_seek !== undefined ? (anti_seek === 'false' ? false : Boolean(anti_seek)) : undefined,
            attachment_url: attachment_url !== undefined ? attachment_url : undefined,
            attachment_name: attachment_name !== undefined ? attachment_name : undefined
        },
        select: videoService.lessonSelect
    });

    res.json({ status: 'success', data: lesson });
});

/**
 * Upload tài liệu đính kèm cho bài học
 */
exports.uploadAttachment = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    if (isNaN(parseInt(lessonId))) throw new ApiError(400, 'Invalid lesson ID');

    if (!req.file) throw new ApiError(400, 'Vui lòng chọn tệp đính kèm');

    try {
        const cleanName = req.file.originalname
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '');

        const publicId = `attachment-${Date.now()}-${cleanName}`;

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'security_video_attachments',
            resource_type: 'raw',
            public_id: publicId
        });

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        const lesson = await prisma.lesson.update({
            where: { id: parseInt(lessonId) },
            data: {
                attachment_url: result.secure_url,
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
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        throw new ApiError(500, `Lỗi upload tài liệu: ${error.message}`);
    }
});

/**
 * Endpoint phục vụ file Manifest .m3u8 (HLS từ R2)
 */
/**
 * Ghi đè URL chìa khóa trong file Manifest (.m3u8) để chèn Token bảo mật
 */
const rewriteManifestWithSignedKey = (content, lessonId, ip) => {
    const normalizedIp = ip.replace('::ffff:', '');
    const token = createVideoToken(`key-${lessonId}`, normalizedIp);
    const signedKeyUrl = `/api/videos/key/${lessonId}?token=${encodeURIComponent(token)}`;

    return content.replace(
        new RegExp(`URI="/api/videos/key/${lessonId}"`, 'g'),
        `URI="${signedKeyUrl}"`
    );
};

/**
 * Endpoint phục vụ file Manifest .m3u8 (HLS từ R2)
 */
exports.streamProxy = catchAsync(async (req, res) => {
    let { token, filePath } = req.params;

    try {
        if (Array.isArray(filePath)) filePath = filePath.join('/');
        if (!filePath) filePath = 'stream.m3u8';

        const payload = verifyStreamToken(token);
        if (!payload) return res.status(403).json({ error: 'Token stream không hợp lệ hoặc đã hết hạn.' });

        const lessonId = payload.lessonId;
        const safeFilePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');

        if (safeFilePath.endsWith('.key') || safeFilePath.endsWith('.keyinfo')) {
            return res.status(403).json({ error: 'Truy cập bị từ chối.' });
        }

        const r2Key = `hls/${lessonId}/${safeFilePath}`;
        const response = await getFileStream(r2Key);

        if (safeFilePath.endsWith('.m3u8')) {
            let content = '';
            return new Promise((resolve, reject) => {
                response.Body.on('data', chunk => content += chunk.toString());
                response.Body.on('end', () => {
                    const newContent = rewriteManifestWithSignedKey(content, lessonId, req.ip);
                    res.set('Content-Type', 'application/x-mpegURL');
                    res.send(newContent);
                    resolve();
                });
                response.Body.on('error', reject);
            });
        }

        res.set({
            'Content-Type': safeFilePath.endsWith('.ts') ? 'video/mp2t' : 'application/octet-stream',
            'Access-Control-Allow-Origin': req.headers.origin || '*',
            'Access-Control-Allow-Credentials': 'true',
            'Cache-Control': 'no-store'
        });
        response.Body.pipe(res);
    } catch (err) {
        console.error('[STREAM FATAL ERROR]', err);
        if (err.name === 'NoSuchKey' || err.code === 'NoSuchKey') {
            return res.status(404).json({ error: 'Video file not found in storage.' });
        }
        return res.status(500).json({ error: err.message });
    }
});


/**
 * Proxy stream link trực tiếp (Cloudinary, v.v.) qua Token AES
 */
exports.secureStream = catchAsync(async (req, res) => {
    const { token } = req.params;

    // Giải mã không kiểm tra IP (Theo yêu cầu cho link Public)
    const payload = decodeVideoToken(token, req.ip);
    if (!payload) return res.status(403).json({ error: 'Token video không hợp lệ hoặc đã hết hạn.' });

    const originalUrl = payload.url;
    console.log(`[SECURE STREAM] Proxying URL: ${originalUrl}`);

    try {
        const headers = {};
        if (req.headers.range) headers.range = req.headers.range;

        const response = await axios({
            method: 'get',
            url: originalUrl,
            responseType: 'stream',
            headers: headers,
            timeout: 30000
        });

        res.set({
            'Content-Type': response.headers['content-type'],
            'Content-Length': response.headers['content-length'],
            'Accept-Ranges': response.headers['accept-ranges'] || 'bytes',
            'Content-Range': response.headers['content-range'],
            'Access-Control-Allow-Origin': req.headers.origin || '*',
            'Access-Control-Allow-Credentials': 'true'
        });

        if (response.status === 206) res.status(206);
        response.data.pipe(res);

        response.data.on('error', () => res.end());
        req.on('close', () => { if (response.data?.destroy) response.data.destroy(); });
    } catch (error) {
        console.error('[SECURE STREAM ERROR]', error.message);
        res.status(500).send('Internal Server Error while streaming');
    }
});

/**
 * Lấy chìa khóa giải mã video HLS (AES-128)
 */
exports.getVideoKey = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const { token } = req.query;
    const userId = req.user.id;
    const roles = req.user.roles || [];

    if (!token) throw new ApiError(403, 'Thiếu mã xác thực chìa khóa');

    const clientIp = req.ip.replace('::ffff:', '');
    const payload = decodeVideoToken(token, clientIp);

    if (!payload || payload.url !== `key-${lessonId}`) {
        throw new ApiError(403, 'Mã xác thực chìa khóa không hợp lệ hoặc đã hết hạn');
    }

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: { section: { select: { course_id: true } } }
    });

    if (!lesson || !lesson.hls_key) throw new ApiError(404, 'Không tìm thấy khóa giải mã');

    // Kiểm tra quyền truy cập
    const isSpecialUser = roles.includes('admin') || roles.includes('instructor');
    if (!lesson.is_free && !isSpecialUser) {
        const courseId = lesson.section.course_id;
        const enrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: courseId } }
        });
        if (!enrollment) throw new ApiError(403, 'Bạn không có quyền truy cập video này');
    }

    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': lesson.hls_key.length,
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true'
    });
    res.send(lesson.hls_key);
});

/**
 * Làm mới token stream
 */
exports.refreshStreamToken = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const lesson = await prisma.lesson.findUnique({ where: { id: parseInt(lessonId) } });
    if (!lesson) throw new ApiError(404, 'Không tìm thấy bài học');

    const newToken = createVideoToken(lesson.video_url, req.ip, 60 * 60 * 1000); // 1 giờ
    res.json({ videoUrl: `/api/videos/secure-stream/${encodeURIComponent(newToken)}` });
});

/**
 * Quét lại thông tin thời lượng
 */
exports.reprobeVideo = catchAsync(async (req, res) => {
    const { id } = req.params;
    const lesson = await prisma.lesson.findUnique({ where: { id: parseInt(id) } });
    const source = lesson.source_url || lesson.video_url;
    const duration = await videoService.getDuration(source);
    await prisma.lesson.update({ where: { id: parseInt(id) }, data: { duration } });
    res.json({ status: 'success', data: { duration } });
});

exports.getManifest = catchAsync(async (req, res) => {
    const { id } = req.params;
    await videoService.ensureHLS(id);
    const manifestPath = path.join(__dirname, `../../public/hls/${id}/master.m3u8`);
    if (!fs.existsSync(manifestPath)) return res.status(202).json({ status: 'processing' });
    res.sendFile(manifestPath);
});

const prisma = require('../configs/prisma');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../configs/cloudinary.config');

const HLS_OUTPUT_DIR = path.join(__dirname, '../../public/hls');
if (!fs.existsSync(HLS_OUTPUT_DIR)) fs.mkdirSync(HLS_OUTPUT_DIR, { recursive: true });

// Biến in-memory để theo dõi các bài học đang trong quá trình băm video
// Giúp tránh Race Condition khi nhiều người cùng truy cập một lúc
const processingLessons = new Set();

/**
 * Cố gắng lấy duration cơ bản (Cloudinary sẽ cung cấp duration chính xác khi upload)
 */
const getDuration = async (source) => {
    return 0; // Thay thế bằng giá trị mặc định, Cloudinary sẽ đè lên
};

/**
 * Upload Video lên Cloudinary
 */
const processVideoToHLS = async (lessonId, inputPath) => {
    if (processingLessons.has(lessonId)) {
        console.log(`Lesson ${lessonId} is already being processed. Skipping...`);
        return;
    }

    try {
        processingLessons.add(lessonId);

        console.log(`Uploading & Transcoding Video to Cloudinary: Lesson ${lessonId}`);
        const result = await cloudinary.uploader.upload_large(inputPath, {
            resource_type: 'video',
            folder: 'security_video_lessons',
            public_id: `lesson_${lessonId}`,
            eager: [
                { streaming_profile: 'hd', format: 'm3u8' }
            ],
            eager_async: false // Đợi Cloudinary băm HLS xong mới trả kết quả về
        });

        const duration = Math.round(result.duration || 0);
        
        // Lấy URL HLS (.m3u8) từ mảng eager thay vì URL MP4 gốc
        let video_url = result.secure_url;
        if (result.eager && result.eager.length > 0) {
            video_url = result.eager[0].secure_url;
        }

        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                video_url: video_url,
                duration: duration,
                hls_key: null,
                hls_iv: null
            }
        });

        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }

        console.log(`Video ${lessonId} processed and saved to DB successfully. URL: ${video_url}`);
        processingLessons.delete(lessonId);
    } catch (error) {
        console.error('Video Service Error (Cloudinary):', error);
        processingLessons.delete(lessonId);
    }
};

// Danh sách các trường an toàn của bài học (Không bao gồm hls_key, hls_iv, source_url)
const lessonSelect = {
    id: true,
    section_id: true,
    title: true,
    type: true,
    content: true,
    video_url: true,
    duration: true,
    order: true,
    is_free: true,
    anti_seek: true,
    attachment_url: true,
    attachment_name: true
};

/**
 * Lấy danh sách video
 */
const getVideos = async () => {
    return await prisma.lesson.findMany({
        select: {
            ...lessonSelect,
            section: {
                include: { course: true }
            }
        }
    });
};

/**
 * Lấy Key giải mã từ database
 */
const getVideoKey = async (lessonId) => {
    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        select: { hls_key: true }
    });
    if (!lesson || !lesson.hls_key) {
        throw new ApiError(404, 'Encryption key not found');
    }
    return lesson.hls_key;
};

/**
 * Xóa video trên Cloudinary và file đính kèm cục bộ
 */
const deleteVideoFiles = async (lessonId) => {
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: parseInt(lessonId) },
            select: { attachment_url: true }
        });

        // Xóa trên Cloudinary
        await cloudinary.uploader.destroy(`security_video_lessons/lesson_${lessonId}`, { resource_type: 'video' });
        console.log(`Deleted video from Cloudinary for lesson ${lessonId}`);

        // Xóa file đính kèm (nếu có)
        if (lesson && lesson.attachment_url) {
            const attachmentPath = path.join(__dirname, '../../', lesson.attachment_url);
            if (fs.existsSync(attachmentPath)) {
                fs.unlinkSync(attachmentPath);
                console.log(`Deleted attachment for lesson ${lessonId}: ${lesson.attachment_url}`);
            }
        }
    } catch (error) {
        console.error(`Error deleting files for lesson ${lessonId}:`, error);
    }
};

/**
 * Đảm bảo file HLS tồn tại (Với Cloudinary thì chỉ cần kiểm tra xem video_url đã có chưa)
 */
const ensureHLS = async (lessonId) => {
    if (processingLessons.has(lessonId)) {
        return false;
    }
    
    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        select: { video_url: true }
    });

    if (lesson && lesson.video_url && lesson.video_url.includes('cloudinary')) {
        return true;
    }

    return false;
};

module.exports = {
    processVideoToHLS,
    getVideos,
    getVideoKey,
    deleteVideoFiles,
    ensureHLS,
    getDuration,
    lessonSelect
};

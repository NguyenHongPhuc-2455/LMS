const prisma = require('../configs/prisma');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { uploadFolder, uploadFile, deleteFolder, R2_PUBLIC_URL } = require('../utils/r2Storage');

// Thư mục HLS local (fallback nếu không có R2, hoặc để hỗ trợ dev)
const HLS_OUTPUT_DIR = path.join(__dirname, '../../public/hls');
if (!fs.existsSync(HLS_OUTPUT_DIR)) fs.mkdirSync(HLS_OUTPUT_DIR, { recursive: true });

// Biến in-memory để theo dõi bài học đang băm - tránh Race Condition
const processingLessons = new Set();

/**
 * Lấy duration video bằng ffprobe
 */
const getDuration = (source) => {
    return new Promise((resolve) => {
        exec(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${source}"`,
            (err, stdout) => {
                if (err || !stdout.trim()) return resolve(0);
                resolve(Math.round(parseFloat(stdout.trim())) || 0);
            }
        );
    });
};

/**
 * Băm video thành HLS và upload lên Cloudflare R2
 */
const processVideoToHLS = async (lessonId, inputPath) => {
    if (processingLessons.has(lessonId)) {
        console.log(`[HLS] Lesson ${lessonId} đang được xử lý. Bỏ qua...`);
        return;
    }

    processingLessons.add(lessonId);

    // Dùng /tmp để tránh vấn đề quyền ghi trên Railway
    const tmpDir = path.join(os.tmpdir(), `hls_${lessonId}_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const masterPlaylist = path.join(tmpDir, 'master.m3u8');

    console.log(`[HLS] Bắt đầu băm video: Lesson ${lessonId}`);

    const ffmpegCmd = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-preset veryfast',         // Giảm tải CPU cho Railway
        '-g 48 -sc_threshold 0',
        '-map 0:v:0 -map 0:a:0',
        '-vf "scale=\'min(1280,iw)\':-2"', // Giữ tỉ lệ, chiều ngang tối đa 1280, chiều cao tự động chia hết cho 2
        '-b:v:0 2800k -b:a:0 128k',
        '-var_stream_map "v:0,a:0"',
        '-master_pl_name master.m3u8',
        '-f hls',
        '-hls_time 6',
        '-hls_list_size 0',
        '-hls_segment_filename', `"${path.join(tmpDir, 'segment_%03d.ts')}"`,
        `"${path.join(tmpDir, 'stream.m3u8')}"`
    ].join(' ');

    return new Promise((resolve) => {
        exec(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 }, async (err) => {
            if (err) {
                console.error(`[HLS] Lỗi FFmpeg Lesson ${lessonId}:`, err.message);
                processingLessons.delete(lessonId);
                // Dọn dẹp thư mục tạm
                fs.rmSync(tmpDir, { recursive: true, force: true });
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                return resolve();
            }

            console.log(`[HLS] FFmpeg hoàn thành. Đang upload lên R2...`);

            try {
                // Upload toàn bộ thư mục HLS lên R2
                const r2Prefix = `hls/${lessonId}`;
                await uploadFolder(tmpDir, r2Prefix);

                // Lấy duration
                const duration = await getDuration(inputPath).catch(() => 0);

                // URL stream qua proxy của server (không dùng public URL trực tiếp để bảo mật)
                const video_url = `hls/${lessonId}/stream.m3u8`;

                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        video_url: video_url, // Lưu đường dẫn R2 key thay vì URL đầy đủ
                        duration: duration,
                        hls_key: null,
                        hls_iv: null
                    }
                });

                console.log(`[HLS] Lesson ${lessonId} đã được xử lý và lưu thành công.`);
            } catch (uploadErr) {
                console.error(`[HLS] Lỗi upload R2 Lesson ${lessonId}:`, uploadErr.message);
            } finally {
                // Dọn dẹp file tạm
                fs.rmSync(tmpDir, { recursive: true, force: true });
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                processingLessons.delete(lessonId);
            }

            resolve();
        });
    });
};

// Danh sách các trường an toàn của bài học
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
        const ApiError = require('../utils/ApiError');
        throw new ApiError(404, 'Encryption key not found');
    }
    return lesson.hls_key;
};

/**
 * Xóa video trên R2
 */
const deleteVideoFiles = async (lessonId) => {
    try {
        // Xóa thư mục HLS trên R2
        await deleteFolder(`hls/${lessonId}`);
        console.log(`[R2] Đã xóa HLS folder của Lesson ${lessonId}`);
    } catch (error) {
        console.error(`[R2] Lỗi xóa video Lesson ${lessonId}:`, error.message);
    }
};

/**
 * Kiểm tra video đã sẵn sàng chưa
 */
const ensureHLS = async (lessonId) => {
    if (processingLessons.has(lessonId)) return false;

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        select: { video_url: true }
    });

    return !!(lesson && lesson.video_url);
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

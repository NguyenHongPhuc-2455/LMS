const prisma = require('../configs/prisma');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');
const axios = require('axios');
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

    let actualInputPath = inputPath;
    let downloadedFilePath = null;

    if (inputPath.startsWith('http')) {
        console.log(`[HLS] Downloading video from URL to /tmp...`);
        try {
            const response = await axios({
                method: 'get',
                url: inputPath,
                responseType: 'stream'
            });
            downloadedFilePath = path.join(tmpDir, 'downloaded_source.mp4');
            const writer = fs.createWriteStream(downloadedFilePath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            actualInputPath = downloadedFilePath;
            console.log(`[HLS] Download complete. Temp file: ${downloadedFilePath}`);
        } catch (error) {
            console.error(`[HLS] Failed to download video URL: ${error.message}`);
            processingLessons.delete(lessonId);
            fs.rmSync(tmpDir, { recursive: true, force: true });
            return;
        }
    }

    const masterPlaylist = path.join(tmpDir, 'master.m3u8');

    // --- KHỞI TẠO MÃ HÓA HLS (AES-128) ---
    const hlsKey = crypto.randomBytes(16); // 16 bytes key
    const hlsIv = crypto.randomBytes(16).toString('hex'); // 16 bytes IV dạng hex

    const keyFileName = 'enc.key';
    const keyFilePath = path.join(tmpDir, keyFileName);
    const keyInfoPath = path.join(tmpDir, 'enc.keyinfo');

    // 1. Ghi file key vật lý (binary)
    fs.writeFileSync(keyFilePath, hlsKey);

    // 2. Tạo file keyinfo cho FFmpeg
    // Dòng 1: URL để trình phát lấy key (thông qua API bảo mật của mình)
    // Dòng 2: Đường dẫn file key vật lý để FFmpeg đọc lúc băm
    // Dòng 3: IV (tùy chọn)
    const keyUrl = `/api/videos/key/${lessonId}`;
    const keyInfoContent = `${keyUrl}\n${keyFilePath}\n${hlsIv}`;
    fs.writeFileSync(keyInfoPath, keyInfoContent);

    console.log(`[HLS] Bắt đầu băm video (Có mã hóa AES-128): Lesson ${lessonId}`);

    const ffmpegCmd = [
        'ffmpeg',
        '-i', `"${actualInputPath}"`,
        '-preset veryfast',
        '-g 48 -sc_threshold 0',
        '-map 0:v:0 -map 0:a:0',
        '-vf "scale=\'min(1280,iw)\':-2"',
        '-c:v libx264 -crf 26 -maxrate 1800k -bufsize 3600k',
        '-c:a aac -b:a 96k',
        '-hls_key_info_file', `"${keyInfoPath}"`, // Kích hoạt mã hóa
        '-var_stream_map "v:0,a:0"',
        '-master_pl_name master.m3u8',
        '-f hls',
        '-hls_time 10',
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

            console.log(`[HLS] FFmpeg hoàn thành. Đang dọn dẹp và upload lên R2...`);

            try {
                // Lấy duration bài học TRƯỚC khi xóa file nguồn
                const duration = await getDuration(actualInputPath).catch(() => 0);

                // --- DỌN DẸP TRƯỚC KHI UPLOAD ---
                // Xóa file key và file cấu hình băm (Chỉ giữ trong DB)
                if (fs.existsSync(keyFilePath)) fs.unlinkSync(keyFilePath);
                if (fs.existsSync(keyInfoPath)) fs.unlinkSync(keyInfoPath);

                // Xóa file video gốc đã tải về (nếu có) để tránh đẩy lên R2
                if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
                    fs.unlinkSync(downloadedFilePath);
                }

                // Upload toàn bộ thư mục HLS lên R2 (Lúc này chỉ còn file .m3u8 và .ts)
                const r2Prefix = `hls/${lessonId}`;
                await uploadFolder(tmpDir, r2Prefix);

                // Lưu thông tin vào DB (Bao gồm Key và IV để giải mã sau này)
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        video_url: `${r2Prefix}/stream.m3u8`, // Lưu path tương đối
                        duration: duration,
                        hls_key: hlsKey, // Lưu Buffer key vào DB
                        hls_iv: hlsIv    // Lưu chuỗi IV vào DB
                    }
                });

                console.log(`[HLS] Lesson ${lessonId} đã được xử lý và lưu thành công (Key đã lưu vào DB).`);
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

const prisma = require('../configs/prisma');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');
const axios = require('axios');
const { uploadFolder, uploadFile, deleteFolder, MINIO_PUBLIC_URL } = require('../utils/r2Storage');

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
 * Tải video từ URL về thư mục tạm (nếu cần)
 */
const downloadSourceIfRemote = async (inputPath, tmpDir) => {
    if (!inputPath.startsWith('http')) return { actualInputPath: inputPath, downloadedFilePath: null };

    console.log(`[HLS] Downloading video from URL...`);
    const downloadedFilePath = path.join(tmpDir, 'downloaded_source.mp4');
    const response = await axios({ method: 'get', url: inputPath, responseType: 'stream' });
    const writer = fs.createWriteStream(downloadedFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return { actualInputPath: downloadedFilePath, downloadedFilePath };
};

/**
 * Thiết lập thông tin mã hóa AES-128 cho HLS
 */
const setupEncryption = (lessonId, tmpDir) => {
    const hlsKey = crypto.randomBytes(16);
    const hlsIv = crypto.randomBytes(16).toString('hex');
    const keyFilePath = path.join(tmpDir, 'enc.key');
    const keyInfoPath = path.join(tmpDir, 'enc.keyinfo');

    fs.writeFileSync(keyFilePath, hlsKey);
    const keyUrl = `/api/videos/key/${lessonId}`;
    fs.writeFileSync(keyInfoPath, `${keyUrl}\n${keyFilePath}\n${hlsIv}`);

    return { hlsKey, hlsIv, keyFilePath, keyInfoPath };
};

/**
 * Chạy FFmpeg để chuyển đổi sang HLS
 */
const runFfmpeg = (inputPath, tmpDir, keyInfoPath) => {
    const ffmpegCmd = [
        'ffmpeg', '-i', `"${inputPath}"`, '-preset veryfast', '-g 48 -sc_threshold 0',
        '-map 0:v:0 -map 0:a:0', '-vf "scale=\'min(1280,iw)\':-2"',
        '-c:v libx264 -crf 26 -maxrate 1800k -bufsize 3600k', '-c:a aac -b:a 96k',
        '-hls_key_info_file', `"${keyInfoPath}"`, '-var_stream_map "v:0,a:0"',
        '-master_pl_name master.m3u8', '-f hls', '-hls_time 10', '-hls_list_size 0',
        '-hls_segment_filename', `"${path.join(tmpDir, 'segment_%03d.ts')}"`,
        `"${path.join(tmpDir, 'stream.m3u8')}"`
    ].join(' ');

    return new Promise((resolve, reject) => {
        exec(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024 }, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

/**
 * Băm video thành HLS và upload lên Cloudflare R2
 */
const processVideoToHLS = async (lessonId, inputPath) => {
    if (processingLessons.has(lessonId)) return;
    processingLessons.add(lessonId);

    const tmpDir = path.join(os.tmpdir(), `hls_${lessonId}_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    let downloadedFilePath = null;
    try {
        // 1. Tải về nếu là URL
        const { actualInputPath, downloadedFilePath: dfp } = await downloadSourceIfRemote(inputPath, tmpDir);
        downloadedFilePath = dfp;

        // 2. Thiết lập mã hóa
        const { hlsKey, hlsIv, keyFilePath, keyInfoPath } = setupEncryption(lessonId, tmpDir);

        // 3. Chạy FFmpeg
        console.log(`[HLS] Bắt đầu băm video: Lesson ${lessonId}`);
        await runFfmpeg(actualInputPath, tmpDir, keyInfoPath);

        // 4. Thu thập thông tin và dọn dẹp để upload
        const duration = await getDuration(actualInputPath).catch(() => 0);
        if (fs.existsSync(keyFilePath)) fs.unlinkSync(keyFilePath);
        if (fs.existsSync(keyInfoPath)) fs.unlinkSync(keyInfoPath);
        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) fs.unlinkSync(downloadedFilePath);

        // 5. Upload R2 và cập nhật DB
        const r2Prefix = `hls/${lessonId}`;
        await uploadFolder(tmpDir, r2Prefix);
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                video_url: `${r2Prefix}/stream.m3u8`,
                duration,
                hls_key: hlsKey,
                hls_iv: hlsIv
            }
        });

        console.log(`[HLS] Lesson ${lessonId} xử lý thành công.`);
    } catch (error) {
        console.error(`[HLS] Lỗi xử lý Lesson ${lessonId}:`, error.message);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        processingLessons.delete(lessonId);
    }
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

const keyCache = new Map();

/**
 * Lấy Key giải mã từ database (có cache in-memory)
 */
const getVideoKey = async (lessonId) => {
    const idStr = String(lessonId);
    if (keyCache.has(idStr)) {
        const entry = keyCache.get(idStr);
        if (entry.expires > Date.now()) {
            return entry.key;
        }
        keyCache.delete(idStr);
    }

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        select: { hls_key: true }
    });
    if (!lesson || !lesson.hls_key) {
        const ApiError = require('../utils/ApiError');
        throw new ApiError(404, 'Encryption key not found');
    }
    
    keyCache.set(idStr, {
        key: lesson.hls_key,
        expires: Date.now() + 60 * 60 * 1000 // Cache 1 giờ
    });
    
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

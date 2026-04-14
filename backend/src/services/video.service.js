const prisma = require('../configs/prisma');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const HLS_OUTPUT_DIR = path.join(__dirname, '../../public/hls');
if (!fs.existsSync(HLS_OUTPUT_DIR)) fs.mkdirSync(HLS_OUTPUT_DIR, { recursive: true });

/**
 * Xử lý Video sang HLS với mã hóa AES-128
 */
const processVideoToHLS = async (lessonId, inputPath) => {
    try {
        // 0. Lấy thông tin thời lượng video
        let duration = 0;
        try {
            const metadata = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(inputPath, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            duration = Math.round(metadata.format.duration || 0);
        } catch (err) {
            console.error('Lỗi lấy metadata video:', err);
        }
        const lessonDir = path.join(HLS_OUTPUT_DIR, lessonId.toString());
        if (!fs.existsSync(lessonDir)) fs.mkdirSync(lessonDir, { recursive: true });

        // 1. Tạo Key & IV bảo mật
        const key = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16).toString('hex');

        const keyPath = path.join(lessonDir, 'enc.key');
        const keyInfoPath = path.join(lessonDir, 'enc.keyinfo');
        const keyUrl = `${process.env.HOST || 'http://localhost:5000'}/api/videos/key/${lessonId}`;

        fs.writeFileSync(keyPath, key);
        fs.writeFileSync(keyInfoPath, `${keyUrl}\n${keyPath.replace(/\\/g, '/')}\n${iv}`);

        const masterPlaylist = path.join(lessonDir, 'master.m3u8');

        // 2. Cấu hình FFmpeg tối ưu
        const ffmpegArgs = [
            '-fflags', '+genpts+igndts',
            '-i', inputPath,
            '-map', '0:v:0',
            '-map', '0:a:0?',
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '26',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-hls_time', '4',
            '-hls_playlist_type', 'vod',
            '-hls_key_info_file', keyInfoPath,
            '-hls_segment_filename', path.join(lessonDir, 'seg_%03d.ts'),
            masterPlaylist
        ];

        console.log(`🎬 Processing Video: Lesson ${lessonId}`);
        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

        ffmpegProcess.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('frame=')) {
                const progress = output.substring(output.lastIndexOf('frame=')).split('\n')[0];
                process.stdout.write(`\r⏳ Progress [Lesson ${lessonId}]: ${progress}`);
            }
        });

        ffmpegProcess.on('close', async (code) => {
            process.stdout.write('\n');
            // Cleanup temporary files
            [inputPath, keyInfoPath, keyPath].forEach(p => {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            });

            if (code === 0) {
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        video_url: `/public/hls/${lessonId}/master.m3u8`,
                        hls_key: key,
                        hls_iv: iv,
                        duration: duration
                    }
                });
                console.log(`✅ Video ${lessonId} optimized and secured.`);
            } else {
                console.error(`❌ FFmpeg failed with code ${code}`);
            }
        });
    } catch (error) {
        console.error('Video Service Error:', error);
    }
};

/**
 * Lấy danh sách video
 */
const getVideos = async () => {
    return await prisma.lesson.findMany({
        include: { section: { include: { course: true } } }
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
 * Xóa folder video HLS vật lý
 */
const deleteVideoFiles = async (lessonId) => {
    const lessonDir = path.join(HLS_OUTPUT_DIR, lessonId.toString());
    if (fs.existsSync(lessonDir)) {
        fs.rmSync(lessonDir, { recursive: true, force: true });
        console.log(`🗑️ Deleted HLS folder for lesson ${lessonId}`);
    }
};

module.exports = {
    processVideoToHLS,
    getVideos,
    getVideoKey,
    deleteVideoFiles
};

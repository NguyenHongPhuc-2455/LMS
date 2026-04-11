const prisma = require('../configs/prisma');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const crypto = require('crypto');

// Thư mục lưu trữ HLS
const HLS_OUTPUT_DIR = path.join(__dirname, '../../public/hls');
if (!fs.existsSync(HLS_OUTPUT_DIR)) fs.mkdirSync(HLS_OUTPUT_DIR, { recursive: true });

/**
 * Xử lý Video sang HLS - Phiên bản Tối ưu hóa Tốc độ & Dung lượng
 * Ưu tiên: Nhẹ, Nhanh, Không lỗi, Hỗ trợ mọi định dạng (AVI, MKV, MP4...)
 */
const processVideoToHLS = (lessonId, inputPath) => {
    try {
        const lessonDir = path.join(HLS_OUTPUT_DIR, lessonId.toString());
        if (!fs.existsSync(lessonDir)) fs.mkdirSync(lessonDir, { recursive: true });

        // TẠO KEY BẢO MẬT
        const key = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16).toString('hex');

        const keyPath = path.join(lessonDir, 'enc.key');
        const keyInfoPath = path.join(lessonDir, 'enc.keyinfo');
        const keyUrl = `${process.env.HOST || 'http://localhost:5000'}/api/videos/key/${lessonId}`;

        fs.writeFileSync(keyPath, key);
        // Quan trọng: FFmpeg trên Windows đôi khi yêu cầu đường dẫn forward slash trong keyinfo
        fs.writeFileSync(keyInfoPath, `${keyUrl}\n${keyPath.replace(/\\/g, '/')}\n${iv}`);

        const masterPlaylist = path.join(lessonDir, 'master.m3u8');

        /**
         * LỆNH FFMPEG TỐI ƯU HÓA HẠT NHÂN:
         * - libx264: Ép chuẩn H.264 tương thích 100% web
         * - crf 26: Nén cực tốt, giữ chất lượng 1080p nhưng dung lượng siêu nhẹ
         * - preset veryfast: Tăng tốc độ băm video
         * - hls_time 4: Phân đoạn 4s giúp tua video nhạy hơn
         * - pix_fmt yuv420p: Đảm bảo chạy được trên mọi trình duyệt
         */
        const ffmpegArgs = [
            '-fflags', '+genpts+igndts',
            '-i', inputPath,
            '-map', '0:v:0',
            '-map', '0:a:0?',
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
            '-c:v', 'libx264',
            '-profile:v', 'main',
            '-level', '3.1',
            '-preset', 'veryfast',
            '-crf', '26',
            '-g', '60',
            '-keyint_min', '60',
            '-sc_threshold', '0',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ac', '2',
            '-ar', '48000',
            '-hls_time', '4',
            '-hls_playlist_type', 'vod',
            '-hls_key_info_file', keyInfoPath,
            '-hls_segment_filename', path.join(lessonDir, 'seg_%03d.ts'),
            masterPlaylist
        ];

        console.log(`🎬 Bắt đầu tối ưu hóa Video (Lesson ID: ${lessonId})...`);
        const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

        // QUAN TRỌNG: Phải tiêu thụ dữ liệu từ stderr để tránh đầy bộ nhớ đệm ống dẫn (Pipe Buffer)
        // Nếu không tiêu thụ, FFmpeg sẽ bị treo (hang) khi xử lý các video dài.
        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('frame=')) {
                // Log vắn tắt tiến độ để không làm rác console
                const progress = output.substring(output.lastIndexOf('frame=')).split('\n')[0];
                process.stdout.write(`\r⏳ Progress [Lesson ${lessonId}]: ${progress}`);
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('\n❌ Lỗi hệ thống khi khởi chạy FFmpeg:', err);
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(keyInfoPath)) fs.unlinkSync(keyInfoPath);
            } catch (e) { }
        });

        ffmpeg.on('close', async (code) => {
            process.stdout.write('\n'); // Xuống dòng sau khi chạy xong progress bar
            // XÓA FILE GỐC & FILE TẠM SAU KHI XỬ LÝ XONG (Tiết kiệm bộ nhớ)
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(keyInfoPath)) fs.unlinkSync(keyInfoPath);
                if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath); // Xóa file key vật lý sau khi đã có key trong memory
                console.log(`🗑️ Hệ thống đã dọn dẹp file gốc và key tạm cho Lesson ${lessonId}`);
            } catch (err) {
                console.error('Lỗi khi dọn dẹp file tạm:', err);
            }

            if (code === 0) {
                // LƯU KEY VÀO DATABASE ĐỂ BẢO MẬT TỐI THƯỢNG
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        video_url: `/public/hls/${lessonId}/master.m3u8`,
                        hls_key: key,
                        hls_iv: iv
                    }
                });
                console.log(`🚀 [OPTIMIZED-HLS] Video ${lessonId} đã được bảo mật vào DB và sẵn sàng!`);
            } else {
                console.error(`❌ FFmpeg lỗi với mã thoát: ${code}. Video gốc đã bị xóa để bảo mật.`);
            }
        });
    } catch (error) {
        console.error('Lỗi quy trình HLS:', error);
    }
};

exports.getVideoKey = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Truy vấn Key trực tiếp từ Database
        const lesson = await prisma.lesson.findUnique({
            where: { id: parseInt(lessonId) },
            select: { hls_key: true }
        });

        if (!lesson || !lesson.hls_key) {
            return res.status(404).send('Encryption key not found in Database');
        }

        // Kiểm tra quyền (Token Authorization đã được middleware xử lý)
        if (!req.user) return res.status(401).send('Unauthorized access');

        res.set('Content-Type', 'application/octet-stream');
        res.set('Cache-Control', 'no-store'); // Không cho trình duyệt cache key
        res.send(lesson.hls_key);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.uploadVideo = async (req, res) => {
    try {
        const { title, section_id } = req.body;
        if (!req.file || !section_id) return res.status(400).json({ error: 'Missing file or sectionID' });

        const lesson = await prisma.lesson.create({
            data: {
                title,
                section_id: parseInt(section_id),
                type: 'VIDEO'
            }
        });

        processVideoToHLS(lesson.id, req.file.path);
        res.status(202).json({ message: 'Đang tối ưu hóa video...', lessonId: lesson.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getVideos = async (req, res) => {
    try {
        const lessons = await prisma.lesson.findMany({
            include: { section: { include: { course: true } } }
        });
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.lesson.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

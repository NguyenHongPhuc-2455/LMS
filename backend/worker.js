require('dotenv').config();
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const redisConfig = require('./src/configs/redis.config');
const videoService = require('./src/services/video.service');

console.log('Khởi động Video Transcoding Worker...');
console.log('Đang kiểm tra kết nối Redis tại:', redisConfig.host, ':', redisConfig.port);

const testClient = new Redis({
    ...redisConfig,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    connectTimeout: 2000
});

testClient.on('error', (err) => {
    // Tránh crash khi có lỗi kết nối trước khi disconnect
});

testClient.connect()
    .then(() => {
        console.log('✅ Kết nối Redis thành công. Bắt đầu đăng ký Worker...');
        testClient.disconnect();
        startWorker();
    })
    .catch((err) => {
        console.error('\n❌ LỖI: Không thể kết nối tới Redis Server!');
        console.error('Để chạy Worker xử lý video nền bằng BullMQ, bạn cần bật Redis trước.');
        console.error('Nếu chưa có Redis, vui lòng cài đặt Redis hoặc chạy qua Docker.');
        console.error('Ứng dụng chính (Backend API) vẫn chạy bình thường và sẽ tự động chuyển sang luồng In-Memory dự phòng khi Redis offline.\n');
        process.exit(1);
    });

function startWorker() {
    const worker = new Worker('video-transcoding', async job => {
        console.log(`[Worker] Bắt đầu xử lý job ${job.id} cho bài học ${job.data.lessonId}`);
        try {
            await videoService.processVideoToHLS(job.data.lessonId, job.data.sourcePath);
            console.log(`[Worker] Job ${job.id} hoàn tất thành công!`);
        } catch (error) {
            console.error(`[Worker] Job ${job.id} thất bại:`, error);
            throw error; // Ném lỗi để BullMQ biết job thất bại và retry
        }
    }, { 
        connection: redisConfig,
        concurrency: 1 // Chỉ xử lý 1 video tại một thời điểm để không quá tải CPU
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job.id} has failed with ${err.message}`);
    });

    process.on('SIGINT', async () => {
        console.log('Đang tắt Worker an toàn...');
        await worker.close();
        process.exit(0);
    });
}

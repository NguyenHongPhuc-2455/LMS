const { Queue } = require('bullmq');
const redisConfig = require('../configs/redis.config');
const Redis = require('ioredis');

let queue = null;
let isRedisAvailable = false;

// Tạo client test kết nối Redis (không thử lại nếu lỗi)
const client = new Redis({
    ...redisConfig,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    connectTimeout: 2000
});

client.on('error', (err) => {
    console.warn('[Queue] Redis offline. Hệ thống sẽ tự động chuyển sang luồng xử lý Video In-Memory cục bộ (không qua Redis).');
    isRedisAvailable = false;
});

client.connect()
    .then(() => {
        isRedisAvailable = true;
        console.log('[Queue] Đã kết nối thành công tới Redis. Sử dụng BullMQ cho Video Transcoding.');
        queue = new Queue('video-transcoding', {
            connection: redisConfig
        });
    })
    .catch(() => {
        isRedisAvailable = false;
    })
    .finally(() => {
        client.disconnect();
    });

// Interface bọc ngoài hỗ trợ Fallback
const videoTranscodeQueue = {
    add: async (name, data, options) => {
        if (isRedisAvailable && queue) {
            return await queue.add(name, data, options);
        } else {
            console.log(`[Queue Fallback] Đang xử lý video bằng luồng In-Memory cho bài học ${data.lessonId}...`);
            const videoService = require('../services/video.service');
            
            // Xử lý không đồng bộ (chạy nền) để không block luồng API chính
            setImmediate(async () => {
                try {
                    await videoService.processVideoToHLS(data.lessonId, data.sourcePath);
                    console.log(`[Queue Fallback] Hoàn thành xử lý video bài học ${data.lessonId} (In-Memory).`);
                } catch (err) {
                    console.error(`[Queue Fallback] Lỗi khi xử lý video bài học ${data.lessonId}:`, err.message);
                }
            });
            return { id: `memory-${Date.now()}` };
        }
    }
};

module.exports = videoTranscodeQueue;

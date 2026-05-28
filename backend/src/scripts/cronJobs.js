const cron = require('node-cron');
const prisma = require('../configs/prisma');
const notificationService = require('../services/notification.service');

const initCronJobs = () => {
    // Chạy vào 00:00 mỗi ngày: '0 0 * * *'
    // Để dễ test, chúng ta có thể đặt chạy mỗi giờ: '0 * * * *' 
    // hoặc chạy vào 8h sáng: '0 8 * * *'
    // Theo yêu cầu, thông báo sẽ được kiểm tra hàng ngày.
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Đang chạy cron job kiểm tra khóa học/lộ trình trễ hạn...');
        try {
            // Lấy tất cả user đang hoạt động
            const users = await prisma.user.findMany({
                where: { deleted_at: null },
                select: { id: true }
            });

            for (const user of users) {
                // Việc chạy hàm này sẽ tự động tạo thông báo khóa/lộ trình trễ hạn cho User,
                // đồng thời tạo Báo cáo trễ hạn gửi tới Admin và Manager.
                await notificationService.checkAndCreateCourseNotifications(user.id);
                
                // Nghỉ 1 chút để nhường CPU và không quá tải DB
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            console.log('[Cron] Đã hoàn thành quét kiểm tra trễ hạn cho', users.length, 'nhân sự.');
        } catch (error) {
            console.error('[Cron] Lỗi khi chạy quét trễ hạn:', error);
        }
    });

    console.log('[Cron] Đã đăng ký tác vụ tự động kiểm tra trễ hạn hàng ngày (00:00).');
};

module.exports = { initCronJobs };

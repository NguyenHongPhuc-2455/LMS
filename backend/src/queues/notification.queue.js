const socketUtils = require('../utils/socket');
const prisma = require('../configs/prisma');

async function processNotificationJob(type, payload) {
    console.log(`[Memory Worker] Processing job of type ${type}`);

    if (type === 'NOTIFY_MANDATORY_COURSE') {
        const { courseId } = payload;
        
        // 1. Lấy thông tin khóa học
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) },
            select: { id: true, title: true, is_mandatory: true, apply_scope: true, mandatory_targets: true }
        });

        if (!course || !course.is_mandatory) return;

        // 2. Lấy tất cả user (chỉ những trường cần thiết cho scope)
        const allUsers = await prisma.user.findMany({
            where: { deleted_at: null },
            select: { id: true, department_id: true, position_id: true, join_date: true }
        });

        const { isUserInScope } = require('../utils/scope');

        // Lấy danh sách phòng ban để tạo bản đồ phân cấp
        const depts = await prisma.department.findMany({ select: { id: true, parent_id: true } });
        const departmentMap = new Map(depts.map(d => [d.id, d.parent_id]));

        // 3. Lọc ra các user thuộc phạm vi áp dụng
        const targetUserIds = allUsers
            .filter(user => isUserInScope(user, course, false, departmentMap))
            .map(u => u.id);

        console.log(`[Memory Worker] Found ${targetUserIds.length} users in scope for course ${courseId}`);

        if (targetUserIds.length === 0) return;

        // 4. Gửi thông báo từ từ (batching / throttling) để không làm nghẽn socket server và Database
        const batchSize = 100;
        for (let i = 0; i < targetUserIds.length; i += batchSize) {
            const batch = targetUserIds.slice(i, i + batchSize);
            
            const timestamp = new Date();
            const notificationsData = batch.map(userId => ({
                user_id: userId,
                title: 'Khóa học bắt buộc mới',
                message: `Bạn vừa được chỉ định tham gia khóa học bắt buộc: ${course.title}`,
                type: 'SYSTEM_COURSE_ASSIGNMENT',
                link: `/course/${course.id}`,
                created_at: timestamp
            }));

            // Lưu hàng loạt vào DB
            await prisma.notification.createMany({
                data: notificationsData
            });

            // Lấy lại các thông báo vừa lưu (nếu cần ID) hoặc gửi format tương tự xuống socket
            batch.forEach((userId, index) => {
                try {
                    socketUtils.emitToUser(userId, 'newNotification', {
                        id: Date.now() + index, // Mock ID tạm cho realtime, frontend sẽ refetch sau
                        title: 'Khóa học bắt buộc mới',
                        message: `Bạn vừa được chỉ định tham gia khóa học bắt buộc: ${course.title}`,
                        type: 'SYSTEM_COURSE_ASSIGNMENT',
                        link: `/course/${course.id}`,
                        is_read: false,
                        created_at: timestamp.toISOString()
                    });
                } catch (err) {
                    console.error(`[Memory Worker] Failed to emit to user ${userId}:`, err.message);
                }
            });

            // Nghỉ 100ms giữa các đợt gửi để nhường CPU
            if (i + batchSize < targetUserIds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        console.log(`[Memory Worker] Hoàn thành gửi thông báo khóa học ${courseId} cho ${targetUserIds.length} user.`);
    }
}

// Giả lập BullMQ Interface để không phải sửa controller
// Chạy background thông qua Node.js event loop
const notificationQueue = {
    add: async (jobName, jobData, options) => {
        setImmediate(async () => {
            try {
                await processNotificationJob(jobData.type, jobData.payload);
            } catch (err) {
                console.error(`[Memory Worker] Job Error:`, err);
            }
        });
        return { id: Date.now() };
    }
};

module.exports = {
    notificationQueue
};

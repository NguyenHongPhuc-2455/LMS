const prisma = require('../configs/prisma');
const socketUtils = require('../utils/socket');

/**
 * Tạo thông báo mới
 */
exports.createNotification = async ({ userId, title, message, type, link }) => {
    const notification = await prisma.notification.create({
        data: {
            user_id: userId,
            title,
            message,
            type,
            link: link || null
        }
    });

    // Phát tín hiệu Realtime qua Socket.io
    socketUtils.emitToUser(userId, 'newNotification', notification);

    return notification;
};

/**
 * Tạo thông báo bất đồng bộ (Không chặn luồng chính)
 */
exports.createNotificationAsync = (data) => {
    setImmediate(async () => {
        try {
            await exports.createNotification(data);
        } catch (error) {
            console.error('Lỗi tạo thông báo ngầm:', error);
        }
    });
};

/**
 * Lấy danh sách thông báo của người dùng
 */
exports.getNotificationsByUserId = async (userId) => {
    return await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50 // Giới hạn 50 thông báo gần nhất
    });
};

/**
 * Đánh dấu thông báo đã đọc
 */
exports.markAsRead = async (notificationId, userId) => {
    return await prisma.notification.updateMany({
        where: {
            id: parseInt(notificationId),
            user_id: userId
        },
        data: { is_read: true }
    });
};

/**
 * Đánh dấu tất cả thông báo của user là đã đọc
 */
exports.markAllAsRead = async (userId) => {
    return await prisma.notification.updateMany({
        where: { user_id: userId, is_read: false },
        data: { is_read: true }
    });
};
/**
 * Xóa một thông báo
 */
exports.deleteNotification = async (notificationId, userId) => {
    return await prisma.notification.deleteMany({
        where: {
            id: parseInt(notificationId),
            user_id: userId
        }
    });
};

/**
 * Xóa tất cả thông báo của user
 */
exports.deleteAllNotifications = async (userId) => {
    return await prisma.notification.deleteMany({
        where: { user_id: userId }
    });
};

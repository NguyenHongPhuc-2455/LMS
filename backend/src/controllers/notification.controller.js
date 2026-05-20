const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getMyNotifications = catchAsync(async (req, res) => {
    const pageVal = req.query.page ? parseInt(req.query.page) : 1;
    const limitVal = req.query.limit ? parseInt(req.query.limit) : 10;

    // Chỉ check và tạo thông báo mới khi ở trang đầu tiên (tránh tải trùng lặp khi cuộn trang)
    if (pageVal === 1) {
        await notificationService.checkAndCreateCourseNotifications(req.user.id);
    }

    const [notifications, unreadCount] = await Promise.all([
        notificationService.getNotificationsByUserId(req.user.id, pageVal, limitVal),
        notificationService.getUnreadCountByUserId(req.user.id)
    ]);
    res.json({ notifications, unreadCount });
});

exports.markAsRead = catchAsync(async (req, res) => {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);
    res.json({ message: 'Đã đánh dấu là đã đọc' });
});

exports.markAllAsRead = catchAsync(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
});
exports.deleteNotification = catchAsync(async (req, res) => {
    const { id } = req.params;
    await notificationService.deleteNotification(id, req.user.id);
    res.json({ message: 'Đã xóa thông báo' });
});

exports.deleteAllNotifications = catchAsync(async (req, res) => {
    await notificationService.deleteAllNotifications(req.user.id);
    res.json({ message: 'Đã xóa tất cả thông báo' });
});

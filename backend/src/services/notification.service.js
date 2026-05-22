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
 * Lấy danh sách thông báo của người dùng (có phân trang)
 */
exports.getNotificationsByUserId = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    return await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip: skip,
        take: parseInt(limit)
    });
};

/**
 * Đếm số thông báo chưa đọc của người dùng
 */
exports.getUnreadCountByUserId = async (userId) => {
    return await prisma.notification.count({
        where: { user_id: userId, is_read: false }
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

/**
 * Kiểm tra các sự kiện học tập (ghi danh mới, sắp hết hạn, quá hạn) để tự động tạo thông báo
 */
exports.checkAndCreateCourseNotifications = async (userId) => {
    try {
        const moment = require('moment');
        const enrollmentService = require('./enrollment.service');

        // 1. Kiểm tra các ghi danh mới trong vòng 3 ngày qua để tạo thông báo ghi danh
        const newEnrollments = await prisma.enrollment.findMany({
            where: {
                user_id: userId,
                enrolled_at: { gte: moment().subtract(3, 'days').toDate() },
                course: { deleted_at: null }
            },
            include: { course: true }
        });

        for (const enrollment of newEnrollments) {
            const hasNotification = await prisma.notification.findFirst({
                where: {
                    user_id: userId,
                    type: 'COURSE_ENROLLED',
                    message: { contains: enrollment.course.title }
                }
            });

            if (!hasNotification) {
                await prisma.notification.create({
                    data: {
                        user_id: userId,
                        title: 'Đăng ký khóa học mới',
                        message: `Bạn đã được ghi danh vào khóa học "${enrollment.course.title}". Hãy bắt đầu học ngay nhé!`,
                        type: 'COURSE_ENROLLED',
                        link: `/courses/${enrollment.course.id}`
                    }
                });
            }
        }

        // 2. Kiểm tra các khóa học bắt buộc sắp hết hạn hoặc quá hạn
        const mandatoryCourses = await enrollmentService.getMandatoryCoursesForUser(userId);

        let student = null;
        if (mandatoryCourses.length > 0) {
            student = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, full_name: true, username: true, department_id: true }
            });
        }

        for (const course of mandatoryCourses) {
            // Nếu đã hoàn thành thì bỏ qua
            if (course.progressPercent === 100 || course.status === 'COMPLETED') continue;

            // Kiểm tra xem đã thông báo có khóa học bắt buộc mới này chưa
            const hasAssignmentNotification = await prisma.notification.findFirst({
                where: {
                    user_id: userId,
                    type: 'NEW_MANDATORY_COURSE',
                    message: { contains: course.title }
                }
            });

            if (!hasAssignmentNotification) {
                await prisma.notification.create({
                    data: {
                        user_id: userId,
                        title: 'Khóa học bắt buộc MỚI',
                        message: `Bạn được chỉ định một khóa học bắt buộc mới: "${course.title}". Hạn hoàn thành trong ${course.mandatory_deadline_days} ngày.`,
                        type: 'NEW_MANDATORY_COURSE',
                        link: `/courses/${course.id}`
                    }
                });
            }

            if (course.isOverdue || course.status === 'OVERDUE') {
                // Quá hạn
                const lastNotification = await prisma.notification.findFirst({
                    where: {
                        user_id: userId,
                        type: 'COURSE_OVERDUE',
                        message: { contains: course.title }
                    },
                    orderBy: { created_at: 'desc' }
                });

                // Chỉ thông báo lại nếu chưa thông báo bao giờ, hoặc thông báo trước đó đã cách 3 ngày
                const shouldNotify = !lastNotification || 
                    moment().diff(moment(lastNotification.created_at), 'days') >= 3;

                if (shouldNotify) {
                    await prisma.notification.create({
                        data: {
                            user_id: userId,
                            title: 'Khóa học bắt buộc ĐÃ QUÁ HẠN',
                            message: `Khóa học bắt buộc "${course.title}" của bạn đã quá hạn hoàn thành. Vui lòng học tập ngay!`,
                            type: 'COURSE_OVERDUE',
                            link: `/courses/${course.id}`
                        }
                    });

                    // Gửi báo cáo cho Admin và Manager phòng ban
                    if (student) {
                        const studentName = student.full_name || student.username;

                        // Lấy danh sách admin
                        const admins = await prisma.user.findMany({
                            where: {
                                user_roles: { some: { role: { name: 'admin' } } }
                            },
                            select: { id: true }
                        });

                        // Lấy danh sách manager cùng phòng ban
                        let managers = [];
                        if (student.department_id) {
                            managers = await prisma.user.findMany({
                                where: {
                                    department_id: student.department_id,
                                    user_roles: { some: { role: { name: 'manager' } } }
                                },
                                select: { id: true }
                            });
                        }

                        // Tập hợp tất cả admin và manager để gửi thông báo (loại trùng lặp và loại trừ chính học viên)
                        const recipientIds = new Set([
                            ...admins.map(a => a.id),
                            ...managers.map(m => m.id)
                        ]);
                        recipientIds.delete(userId);

                        for (const recipientId of recipientIds) {
                            await exports.createNotification({
                                userId: recipientId,
                                title: 'Báo cáo: Nhân sự quá hạn khóa học bắt buộc',
                                message: `Nhân sự ${studentName} đã quá hạn hoàn thành khóa học bắt buộc "${course.title}".`,
                                type: 'COURSE_OVERDUE_REPORT',
                                link: `/admin/course-management`
                            });
                        }
                    }
                }
            } else if (course.remainingDays >= 0 && course.remainingDays <= 7) {
                // Sắp hết hạn (còn dưới 7 ngày)
                const lastNotification = await prisma.notification.findFirst({
                    where: {
                        user_id: userId,
                        type: 'COURSE_EXPIRING',
                        message: { contains: course.title }
                    },
                    orderBy: { created_at: 'desc' }
                });

                // Chỉ thông báo lại nếu chưa thông báo bao giờ, hoặc thông báo trước đó đã cách 3 ngày
                const shouldNotify = !lastNotification || 
                    moment().diff(moment(lastNotification.created_at), 'days') >= 3;

                if (shouldNotify) {
                    await prisma.notification.create({
                        data: {
                            user_id: userId,
                            title: 'Khóa học bắt buộc SẮP HẾT HẠN',
                            message: `Khóa học bắt buộc "${course.title}" của bạn sắp hết hạn. Chỉ còn ${course.remainingDays} ngày để hoàn thành!`,
                            type: 'COURSE_EXPIRING',
                            link: `/courses/${course.id}`
                        }
                    });
                }
            }
        }

        // 3. Kiểm tra các ghi danh lộ trình mới trong vòng 3 ngày qua để tạo thông báo ghi danh lộ trình
        const newProgramEnrollments = await prisma.programEnrollment.findMany({
            where: {
                user_id: userId,
                enrolled_at: { gte: moment().subtract(3, 'days').toDate() },
                program: { deleted_at: null }
            },
            include: { program: true }
        });

        for (const enrollment of newProgramEnrollments) {
            const hasNotification = await prisma.notification.findFirst({
                where: {
                    user_id: userId,
                    type: 'PROGRAM_ENROLLED',
                    message: { contains: enrollment.program.title }
                }
            });

            if (!hasNotification) {
                await prisma.notification.create({
                    data: {
                        user_id: userId,
                        title: 'Đăng ký lộ trình mới',
                        message: `Bạn đã được ghi danh vào lộ trình học "${enrollment.program.title}". Hãy bắt đầu học ngay nhé!`,
                        type: 'PROGRAM_ENROLLED',
                        link: `/programs/${enrollment.program.id}`
                    }
                });
            }
        }

        // 4. Kiểm tra các lộ trình bắt buộc sắp hết hạn hoặc quá hạn
        const programService = require('./program.service');
        const mandatoryPrograms = await programService.getMandatoryProgramsForUser(userId);

        for (const program of mandatoryPrograms) {
            // Nếu đã hoàn thành thì bỏ qua
            if (program.progressPercent === 100 || program.status === 'COMPLETED') continue;

            // Kiểm tra xem đã thông báo có lộ trình bắt buộc mới này chưa
            const hasAssignmentNotification = await prisma.notification.findFirst({
                where: {
                    user_id: userId,
                    type: 'NEW_MANDATORY_PROGRAM',
                    message: { contains: program.title }
                }
            });

            if (!hasAssignmentNotification) {
                await prisma.notification.create({
                    data: {
                        user_id: userId,
                        title: 'Lộ trình bắt buộc MỚI',
                        message: `Bạn được chỉ định một lộ trình học bắt buộc mới: "${program.title}". Hạn hoàn thành trong ${program.mandatory_deadline_days} ngày.`,
                        type: 'NEW_MANDATORY_PROGRAM',
                        link: `/programs/${program.id}`
                    }
                });
            }

            if (program.isOverdue || program.status === 'OVERDUE') {
                // Quá hạn
                const lastNotification = await prisma.notification.findFirst({
                    where: {
                        user_id: userId,
                        type: 'PROGRAM_OVERDUE',
                        message: { contains: program.title }
                    },
                    orderBy: { created_at: 'desc' }
                });

                // Chỉ thông báo lại nếu chưa thông báo bao giờ, hoặc thông báo trước đó đã cách 3 ngày
                const shouldNotify = !lastNotification || 
                    moment().diff(moment(lastNotification.created_at), 'days') >= 3;

                if (shouldNotify) {
                    await prisma.notification.create({
                        data: {
                            user_id: userId,
                            title: 'Lộ trình bắt buộc ĐÃ QUÁ HẠN',
                            message: `Lộ trình học bắt buộc "${program.title}" của bạn đã quá hạn hoàn thành. Vui lòng học tập ngay!`,
                            type: 'PROGRAM_OVERDUE',
                            link: `/programs/${program.id}`
                        }
                    });

                    // Gửi báo cáo cho Admin và Manager phòng ban
                    if (student) {
                        const studentName = student.full_name || student.username;

                        // Lấy danh sách admin
                        const admins = await prisma.user.findMany({
                            where: {
                                user_roles: { some: { role: { name: 'admin' } } }
                            },
                            select: { id: true }
                        });

                        // Lấy danh sách manager cùng phòng ban
                        let managers = [];
                        if (student.department_id) {
                            managers = await prisma.user.findMany({
                                where: {
                                    department_id: student.department_id,
                                    user_roles: { some: { role: { name: 'manager' } } }
                                },
                                select: { id: true }
                            });
                        }

                        const recipientIds = new Set([
                            ...admins.map(a => a.id),
                            ...managers.map(m => m.id)
                        ]);
                        recipientIds.delete(userId);

                        for (const recipientId of recipientIds) {
                            await exports.createNotification({
                                userId: recipientId,
                                title: 'Báo cáo: Nhân sự quá hạn lộ trình bắt buộc',
                                message: `Nhân sự ${studentName} đã quá hạn hoàn thành lộ trình học bắt buộc "${program.title}".`,
                                type: 'PROGRAM_OVERDUE_REPORT',
                                link: `/admin/programs`
                            });
                        }
                    }
                }
            } else if (program.remainingDays >= 0 && program.remainingDays <= 7) {
                // Sắp hết hạn (còn dưới 7 ngày)
                const lastNotification = await prisma.notification.findFirst({
                    where: {
                        user_id: userId,
                        type: 'PROGRAM_EXPIRING',
                        message: { contains: program.title }
                    },
                    orderBy: { created_at: 'desc' }
                });

                // Chỉ thông báo lại nếu chưa thông báo bao giờ, hoặc thông báo trước đó đã cách 3 ngày
                const shouldNotify = !lastNotification || 
                    moment().diff(moment(lastNotification.created_at), 'days') >= 3;

                if (shouldNotify) {
                    await prisma.notification.create({
                        data: {
                            user_id: userId,
                            title: 'Lộ trình bắt buộc SẮP HẾT HẠN',
                            message: `Lộ trình học bắt buộc "${program.title}" của bạn sắp hết hạn. Chỉ còn ${program.remainingDays} ngày để hoàn thành!`,
                            type: 'PROGRAM_EXPIRING',
                            link: `/programs/${program.id}`
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra và tạo thông báo khóa học:', error);
    }
};

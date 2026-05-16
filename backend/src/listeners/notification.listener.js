const events = require('../utils/events');
const notificationService = require('../services/notification.service');
const { FRONTEND_URLS } = require('../configs/paths');
const prisma = require('../configs/prisma');

/**
 * Lắng nghe các sự kiện hệ thống và chuyển đổi thành thông báo cho người dùng
 */
const initNotificationListener = () => {
    
    // 1. Khi có người phản hồi bình luận
    events.on('comment.reply', async ({ parentComment, newComment, lesson }) => {
        try {
            if (parentComment.user_id === newComment.user_id) return;

            const courseId = lesson.section.course_id;
            
            await notificationService.createNotification({
                userId: parentComment.user_id,
                title: 'Phản hồi bình luận mới',
                message: `Ai đó đã phản hồi bình luận của bạn trong bài học: ${lesson.title}`,
                type: 'COMMENT_REPLY',
                link: FRONTEND_URLS.COURSE_LEARNING(courseId, lesson.id, newComment.id)
            });
        } catch (error) {
            console.error('Listener Error [comment.reply]:', error);
        }
    });

    // 2. Khi học viên gửi yêu cầu tham gia khóa học mới (Thông báo cho Admin)
    events.on('course.request_new', async ({ request, student, course }) => {
        try {
            const admins = await prisma.user.findMany({
                where: {
                    user_roles: {
                        some: { role: { name: 'admin' } }
                    }
                },
                select: { id: true }
            });

            for (const admin of admins) {
                notificationService.createNotificationAsync({
                    userId: admin.id,
                    title: 'Yêu cầu phê duyệt khóa học mới',
                    message: `Học viên ${student.full_name || student.username} đã gửi yêu cầu tham gia khóa học "${course.title}".`,
                    type: 'NEW_COURSE_REQUEST',
                    link: FRONTEND_URLS.ADMIN_COURSE_REQUESTS
                });
            }
        } catch (error) {
            console.error('Listener Error [course.request_new]:', error);
        }
    });

    // 3. Khi yêu cầu khóa học được phê duyệt
    events.on('course.request_approved', async ({ request, course }) => {
        try {
            await notificationService.createNotificationAsync({
                userId: request.user_id,
                title: 'Yêu cầu được phê duyệt',
                message: `Yêu cầu tham gia khóa học "${course.title}" của bạn đã được phê duyệt.`,
                type: 'COURSE_APPROVAL',
                link: FRONTEND_URLS.COURSE_DETAIL(course.id)
            });
        } catch (error) {
            console.error('Listener Error [course.request_approved]:', error);
        }
    });

    // 4. Khi yêu cầu khóa học bị từ chối
    events.on('course.request_rejected', async ({ request, course }) => {
        try {
            await notificationService.createNotificationAsync({
                userId: request.user_id,
                title: 'Yêu cầu bị từ chối',
                message: `Yêu cầu tham gia khóa học "${course.title}" của bạn đã bị từ chối.`,
                type: 'COURSE_REJECTION',
                link: FRONTEND_URLS.COURSE_DETAIL(course.id)
            });
        } catch (error) {
            console.error('Listener Error [course.request_rejected]:', error);
        }
    });

    // 5. Khi học viên gửi yêu cầu tham gia lộ trình (Admin)
    events.on('program.request_new', async ({ request, student, program }) => {
        try {
            const admins = await prisma.user.findMany({
                where: { user_roles: { some: { role: { name: 'admin' } } } },
                select: { id: true }
            });

            for (const admin of admins) {
                notificationService.createNotificationAsync({
                    userId: admin.id,
                    title: 'Yêu cầu phê duyệt lộ trình mới',
                    message: `Học viên ${student.full_name || student.username} đã gửi yêu cầu tham gia lộ trình "${program.title}".`,
                    type: 'NEW_PROGRAM_REQUEST',
                    link: FRONTEND_URLS.ADMIN_PROGRAM_REQUESTS
                });
            }
        } catch (error) {
            console.error('Listener Error [program.request_new]:', error);
        }
    });

    // 6. Khi lộ trình được phê duyệt
    events.on('program.request_approved', async ({ request, program }) => {
        try {
            await notificationService.createNotificationAsync({
                userId: request.user_id,
                title: 'Yêu cầu lộ trình học được phê duyệt',
                message: `Yêu cầu tham gia lộ trình "${program.title}" của bạn đã được phê duyệt. Toàn bộ khóa học trong lộ trình đã được mở khóa.`,
                type: 'PROGRAM_APPROVAL',
                link: FRONTEND_URLS.PROGRAM_DETAIL(program.id)
            });
        } catch (error) {
            console.error('Listener Error [program.request_approved]:', error);
        }
    });

    // 7. Khi lộ trình bị từ chối
    events.on('program.request_rejected', async ({ request, program }) => {
        try {
            await notificationService.createNotificationAsync({
                userId: request.user_id,
                title: 'Yêu cầu lộ trình học bị từ chối',
                message: `Yêu cầu tham gia lộ trình "${program.title}" của bạn đã bị từ chối.`,
                type: 'PROGRAM_REJECTION',
                link: FRONTEND_URLS.PROGRAM_DETAIL(program.id)
            });
        } catch (error) {
            console.error('Listener Error [program.request_rejected]:', error);
        }
    });

    console.log('✅ Notification Listener initialized');
};

module.exports = {
    initNotificationListener
};

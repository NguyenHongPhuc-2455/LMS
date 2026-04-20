const prisma = require('../configs/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const notificationService = require('../services/notification.service');

/**
 * Gửi yêu cầu tham gia khóa học private
 */
exports.requestAccess = catchAsync(async (req, res) => {
    const { courseId, reason } = req.body;
    const userId = req.user.id;

    if (!courseId) throw new ApiError(400, 'Thiếu Course ID');

    // 1. Kiểm tra khóa học có tồn tại và là private không
    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
    });

    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');
    if (!course.is_private) {
        throw new ApiError(400, 'Khóa học này không phải là khóa học riêng tư (private)');
    }

    // 2. Kiểm tra đã có quyền truy cập (Enrollment) chưa
    const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
            user_id_course_id: {
                user_id: userId,
                course_id: parseInt(courseId)
            }
        }
    });

    if (existingEnrollment) {
        return res.status(400).json({ message: 'Bạn đã có quyền truy cập khóa học này rồi' });
    }

    // 3. Kiểm tra xem đã gửi yêu cầu chưa
    const existingRequest = await prisma.courseRequest.findFirst({
        where: {
            user_id: userId,
            course_id: parseInt(courseId),
            status: 'PENDING'
        }
    });

    if (existingRequest) {
        return res.status(400).json({ message: 'Yêu cầu của bạn đang chờ phê duyệt' });
    }

    // 4. Tạo yêu cầu mới
    const newRequest = await prisma.courseRequest.create({
        data: {
            user_id: userId,
            course_id: parseInt(courseId),
            reason,
            status: 'PENDING'
        }
    });

    // 5. Thông báo cho tất cả Admin
    try {
        const admins = await prisma.user.findMany({
            where: {
                user_roles: {
                    some: {
                        role: { name: 'admin' }
                    }
                }
            },
            select: { id: true }
        });

        const student = await prisma.user.findUnique({
            where: { id: userId },
            select: { full_name: true, username: true }
        });

        for (const admin of admins) {
            await notificationService.createNotification({
                userId: admin.id,
                title: 'Yêu cầu phê duyệt khóa học mới',
                message: `Học viên ${student.full_name || student.username} đã gửi yêu cầu tham gia khóa học "${course.title}".`,
                type: 'NEW_COURSE_REQUEST',
                link: `/admin/requests`
            });
        }
    } catch (error) {
        console.error('❌ Lỗi khi gửi thông báo cho Admin:', error);
    }

    res.status(201).json({
        message: 'Gửi yêu cầu thành công, vui lòng chờ Admin phê duyệt',
        data: newRequest
    });
});

/**
 * Lấy danh sách yêu cầu của bản thân
 */
exports.getMyRequests = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const requests = await prisma.courseRequest.findMany({
        where: { user_id: userId },
        include: {
            course: {
                select: { title: true, thumbnail: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });
    res.json(requests);
});

/**
 * Láy danh sách yêu cầu đang chờ (Dành cho Admin/Manager)
 */
exports.getPendingRequests = catchAsync(async (req, res) => {
    const requests = await prisma.courseRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            user: {
                select: { id: true, full_name: true, email: true, username: true }
            },
            course: {
                select: { id: true, title: true }
            }
        },
        orderBy: { created_at: 'asc' }
    });
    res.json(requests);
});

/**
 * Phê duyệt yêu cầu
 */
exports.approveRequest = catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await prisma.courseRequest.findUnique({
        where: { id: parseInt(id) }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    // 1. Cập nhật trạng thái yêu cầu
    const updatedRequest = await prisma.courseRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED' }
    });

    // 2. Tạo Enrollment để cấp quyền truy cập
    await prisma.enrollment.upsert({
        where: {
            user_id_course_id: {
                user_id: request.user_id,
                course_id: request.course_id
            }
        },
        update: {},
        create: {
            user_id: request.user_id,
            course_id: request.course_id
        }
    });

    // 3. Thông báo cho người dùng
    const course = await prisma.course.findUnique({
        where: { id: request.course_id },
        select: { title: true }
    });

    await notificationService.createNotification({
        userId: request.user_id,
        title: 'Yêu cầu được phê duyệt',
        message: `Yêu cầu tham gia khóa học "${course.title}" của bạn đã được phê duyệt.`,
        type: 'COURSE_APPROVAL',
        link: `/course/${request.course_id}`
    });

    res.json({ message: 'Đã phê duyệt và cấp quyền truy cập khóa học', data: updatedRequest });
});

/**
 * Từ chối yêu cầu
 */
exports.rejectRequest = catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await prisma.courseRequest.findUnique({
        where: { id: parseInt(id) }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    const updatedRequest = await prisma.courseRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'REJECTED' }
    });

    // Thông báo cho người dùng
    const course = await prisma.course.findUnique({
        where: { id: request.course_id },
        select: { title: true }
    });

    await notificationService.createNotification({
        userId: request.user_id,
        title: 'Yêu cầu bị từ chối',
        message: `Yêu cầu tham gia khóa học "${course.title}" của bạn đã bị từ chối.`,
        type: 'COURSE_REJECTION',
        link: `/course/${request.course_id}`
    });

    res.json({ message: 'Đã từ chối yêu cầu truy cập', data: updatedRequest });
});

exports.approveBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const requests = await prisma.courseRequest.findMany({
        where: { id: { in: ids.map(id => parseInt(id)) }, status: 'PENDING' },
        include: { course: { select: { id: true, title: true } } }
    });

    for (const request of requests) {
        await prisma.courseRequest.update({
            where: { id: request.id },
            data: { status: 'APPROVED' }
        });

        await prisma.enrollment.upsert({
            where: { user_id_course_id: { user_id: request.user_id, course_id: request.course_id } },
            update: {},
            create: { user_id: request.user_id, course_id: request.course_id }
        });

        await notificationService.createNotification({
            userId: request.user_id,
            title: 'Yêu cầu được phê duyệt',
            message: `Yêu cầu tham gia khóa học "${request.course.title}" của bạn đã được phê duyệt.`,
            type: 'COURSE_APPROVAL',
            link: `/course/${request.course_id}`
        });
    }

    res.json({ message: `Đã phê duyệt ${requests.length} yêu cầu` });
});

exports.rejectBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const requests = await prisma.courseRequest.findMany({
        where: { id: { in: ids.map(id => parseInt(id)) }, status: 'PENDING' },
        include: { course: { select: { id: true, title: true } } }
    });

    for (const request of requests) {
        await prisma.courseRequest.update({
            where: { id: request.id },
            data: { status: 'REJECTED' }
        });

        await notificationService.createNotification({
            userId: request.user_id,
            title: 'Yêu cầu bị từ chối',
            message: `Yêu cầu tham gia khóa học "${request.course.title}" của bạn đã bị từ chối.`,
            type: 'COURSE_REJECTION',
            link: `/course/${request.course_id}`
        });
    }

    res.json({ message: `Đã từ chối ${requests.length} yêu cầu` });
});


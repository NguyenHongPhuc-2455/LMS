const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const events = require('../utils/events');
const statsService = require('./stats.service');

/**
 * Gửi yêu cầu tham gia khóa học private
 */
const requestAccess = async (userId, courseId, reason) => {
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
        throw new ApiError(400, 'Bạn đã có quyền truy cập khóa học này rồi');
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
        throw new ApiError(400, 'Yêu cầu của bạn đang chờ phê duyệt');
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

    // 5. Emit sự kiện để thông báo cho Admin
    const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true, username: true }
    });

    events.emit('course.request_new', { request: newRequest, student, course });

    // Cập nhật số lượng cho Admin
    await statsService.emitPendingRequestsCountToAdmins();

    return newRequest;
};

/**
 * Lấy danh sách yêu cầu của bản thân
 */
const getMyRequests = async (userId) => {
    return await prisma.courseRequest.findMany({
        where: {
            user_id: userId,
            course: { deleted_at: null }
        },
        include: {
            course: { select: { title: true, thumbnail: true } }
        },
        orderBy: { created_at: 'desc' }
    });
};

/**
 * Lấy danh sách yêu cầu đang chờ (Admin/Manager)
 */
const getPendingRequests = async () => {
    return await prisma.courseRequest.findMany({
        where: {
            status: 'PENDING',
            course: { deleted_at: null }
        },
        include: {
            user: { select: { id: true, full_name: true, email: true, username: true } },
            course: { select: { id: true, title: true } }
        },
        orderBy: { created_at: 'asc' }
    });
};

/**
 * Phê duyệt yêu cầu
 */
const approveRequest = async (id) => {
    const request = await prisma.courseRequest.findUnique({
        where: { id: parseInt(id) },
        include: { course: { select: { id: true, title: true } } }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    return await prisma.$transaction(async (tx) => {
        // 1. Cập nhật trạng thái yêu cầu
        const updatedRequest = await tx.courseRequest.update({
            where: { id: parseInt(id) },
            data: { status: 'APPROVED' }
        });

        // 2. Tạo Enrollment để cấp quyền truy cập
        await tx.enrollment.upsert({
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

        // 3. Emit sự kiện thông báo
        events.emit('course.request_approved', { request, course: request.course });

        // Cập nhật số lượng cho Admin
        await statsService.emitPendingRequestsCountToAdmins();

        return updatedRequest;
    });
};

/**
 * Từ chối yêu cầu
 */
const rejectRequest = async (id) => {
    const request = await prisma.courseRequest.findUnique({
        where: { id: parseInt(id) },
        include: { course: { select: { id: true, title: true } } }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    const updatedRequest = await prisma.courseRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'REJECTED' }
    });

    // Emit sự kiện thông báo
    events.emit('course.request_rejected', { request, course: request.course });

    // Cập nhật số lượng cho Admin
    await statsService.emitPendingRequestsCountToAdmins();

    return updatedRequest;
};

/**
 * Phê duyệt hàng loạt
 */
const approveBulk = async (ids) => {
    const results = [];
    for (const id of ids) {
        try {
            results.push(await approveRequest(id));
        } catch (e) {
            console.error(`Lỗi approve bulk id ${id}:`, e.message);
        }
    }
    return results;
};

/**
 * Từ chối hàng loạt
 */
const rejectBulk = async (ids) => {
    const results = [];
    for (const id of ids) {
        try {
            results.push(await rejectRequest(id));
        } catch (e) {
            console.error(`Lỗi reject bulk id ${id}:`, e.message);
        }
    }
    return results;
};

module.exports = {
    requestAccess,
    getMyRequests,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    approveBulk,
    rejectBulk
};

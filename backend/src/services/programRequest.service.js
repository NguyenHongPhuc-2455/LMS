const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const events = require('../utils/events');
const statsService = require('./stats.service');
const redisClient = require('../utils/redisClient');

/**
 * Gửi yêu cầu tham gia lộ trình private
 */
const requestAccess = async (userId, programId, reason) => {
    const id = parseInt(programId);

    // 1. Kiểm tra lộ trình tồn tại và private
    const program = await prisma.learningProgram.findUnique({
        where: { id }
    });

    if (!program) throw new ApiError(404, 'Không tìm thấy lộ trình học');
    if (!program.is_private) {
        throw new ApiError(400, 'Lộ trình này không phải là riêng tư (private)');
    }

    // 2. Kiểm tra ghi danh
    const existingEnrollment = await prisma.programEnrollment.findUnique({
        where: { user_id_program_id: { user_id: userId, program_id: id } }
    });

    if (existingEnrollment) {
        throw new ApiError(400, 'Bạn đã có quyền truy cập lộ trình này rồi');
    }

    // 3. Kiểm tra yêu cầu đang chờ
    const existingRequest = await prisma.programRequest.findFirst({
        where: { user_id: userId, program_id: id, status: 'PENDING' }
    });

    if (existingRequest) {
        throw new ApiError(400, 'Yêu cầu của bạn đang chờ phê duyệt');
    }

    // 4. Tạo yêu cầu
    const newRequest = await prisma.programRequest.create({
        data: { user_id: userId, program_id: id, reason, status: 'PENDING' }
    });

    // 5. Emit sự kiện cho Admin
    const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { full_name: true, username: true, department_id: true }
    });

    events.emit('program.request_new', { request: newRequest, student, program });

    // Cập nhật thống kê Admin và Manager phòng ban
    await statsService.emitPendingRequestsCountToAdmins(student.department_id);

    return newRequest;
};

/**
 * Lấy danh sách yêu cầu đang chờ (Admin/Manager)
 * @param {number|null} departmentId - Nếu có thì chỉ lấy yêu cầu của user thuộc phòng ban đó
 */
const getPendingRequests = async (departmentId = null, page = null, limit = null) => {
    let query = {
        where: { 
            status: 'PENDING',
            program: { deleted_at: null },
            ...(departmentId && {
                user: { department_id: parseInt(departmentId) }
            })
        },
        include: {
            user: { select: { id: true, full_name: true, email: true, username: true, department_id: true } },
            program: { select: { id: true, title: true } }
        },
        orderBy: { created_at: 'asc' }
    };

    if (page !== null && limit !== null) {
        const total = await prisma.programRequest.count({ where: query.where });
        query.skip = (page - 1) * limit;
        query.take = limit;
        const data = await prisma.programRequest.findMany(query);
        return { data, total };
    }

    return await prisma.programRequest.findMany(query);
};

/**
 * Phê duyệt yêu cầu lộ trình
 * @param {number|null} managerDeptId - Nếu có, kiểm tra user phải thuộc phòng ban của Manager
 */
const approveRequest = async (id, managerDeptId = null) => {
    const requestId = parseInt(id);
    const request = await prisma.programRequest.findUnique({
        where: { id: requestId },
        include: {
            program: { include: { courses: true } },
            user: { select: { id: true, department_id: true } }
        }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    // Guard Clause: Chặn Manager duyệt yêu cầu của user phòng ban khác
    if (managerDeptId && request.user?.department_id !== parseInt(managerDeptId)) {
        throw new ApiError(403, 'Bạn không có quyền phê duyệt yêu cầu của nhân sự phòng ban khác');
    }

    return await prisma.$transaction(async (tx) => {
        // 1. Cập nhật trạng thái
        const updatedRequest = await tx.programRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' }
        });

        // 2. Ghi danh vào lộ trình
        await tx.programEnrollment.upsert({
            where: { user_id_program_id: { user_id: request.user_id, program_id: request.program_id } },
            update: {},
            create: { user_id: request.user_id, program_id: request.program_id }
        });

        // 3. TỰ ĐỘNG CẤP QUYỀN TRUY CẬP CHO TOÀN BỘ KHÓA HỌC TRONG CHƯƠNG TRÌNH
        const programCourseIds = request.program.courses.map(pc => pc.course_id);
        
        for (const cid of programCourseIds) {
            await tx.enrollment.upsert({
                where: { user_id_course_id: { user_id: request.user_id, course_id: cid } },
                update: {},
                create: { user_id: request.user_id, course_id: cid }
            });
        }

        // 4. Dọn dẹp yêu cầu khóa học đơn lẻ bị trùng
        await tx.courseRequest.deleteMany({
            where: { user_id: request.user_id, course_id: { in: programCourseIds } }
        });

        // 5. Emit sự kiện thông báo cho học viên
        events.emit('program.request_approved', { request, program: request.program });

        // Cập nhật thống kê Admin và Manager phòng ban
        await statsService.emitPendingRequestsCountToAdmins(request.user?.department_id);

        // Xóa cache dashboard
        await redisClient.clearDashboardCache();

        return updatedRequest;
    });
};

/**
 * Từ chối yêu cầu lộ trình
 * @param {number|null} managerDeptId - Nếu có, kiểm tra user phải thuộc phòng ban của Manager
 */
const rejectRequest = async (id, managerDeptId = null) => {
    const requestId = parseInt(id);
    const request = await prisma.programRequest.findUnique({
        where: { id: requestId },
        include: {
            program: true,
            user: { select: { id: true, department_id: true } }
        }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    // Guard Clause
    if (managerDeptId && request.user?.department_id !== parseInt(managerDeptId)) {
        throw new ApiError(403, 'Bạn không có quyền từ chối yêu cầu của nhân sự phòng ban khác');
    }

    const updatedRequest = await prisma.programRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
    });

    // Emit sự kiện thông báo
    events.emit('program.request_rejected', { request, program: request.program });

    // Cập nhật thống kê Admin và Manager phòng ban
    await statsService.emitPendingRequestsCountToAdmins(request.user?.department_id);

    // Xóa cache dashboard
    await redisClient.clearDashboardCache();

    return updatedRequest;
};

const approveBulk = async (ids) => {
    const results = [];
    for (const id of ids) {
        try {
            results.push(await approveRequest(id));
        } catch (e) {
            console.error(`Lỗi approve bulk program id ${id}:`, e.message);
        }
    }
    return results;
};

const rejectBulk = async (ids) => {
    const results = [];
    for (const id of ids) {
        try {
            results.push(await rejectRequest(id));
        } catch (e) {
            console.error(`Lỗi reject bulk program id ${id}:`, e.message);
        }
    }
    return results;
};

module.exports = {
    requestAccess,
    getPendingRequests,
    approveRequest,
    rejectRequest,
    approveBulk,
    rejectBulk
};

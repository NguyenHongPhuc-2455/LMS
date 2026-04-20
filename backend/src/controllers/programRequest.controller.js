const prisma = require('../configs/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const notificationService = require('../services/notification.service');

/**
 * Gửi yêu cầu tham gia chương trình học private
 */
exports.requestAccess = catchAsync(async (req, res) => {
    const { programId, reason } = req.body;
    const userId = req.user.id;

    if (!programId) throw new ApiError(400, 'Thiếu Program ID');

    // 1. Kiểm tra chương trình có tồn tại và là private không
    const program = await prisma.learningProgram.findUnique({
        where: { id: parseInt(programId) }
    });

    if (!program) throw new ApiError(404, 'Không tìm thấy chương trình học');
    if (!program.is_private) {
        throw new ApiError(400, 'Chương trình này không phải là riêng tư (private)');
    }

    // 2. Kiểm tra đã có quyền truy cập (ProgramEnrollment) chưa
    const existingEnrollment = await prisma.programEnrollment.findUnique({
        where: {
            user_id_program_id: {
                user_id: userId,
                program_id: parseInt(programId)
            }
        }
    });

    if (existingEnrollment) {
        return res.status(400).json({ message: 'Bạn đã có quyền truy cập chương trình này rồi' });
    }

    // 3. Kiểm tra xem đã gửi yêu cầu chưa
    const existingRequest = await prisma.programRequest.findFirst({
        where: {
            user_id: userId,
            program_id: parseInt(programId),
            status: 'PENDING'
        }
    });

    if (existingRequest) {
        return res.status(400).json({ message: 'Yêu cầu của bạn đang chờ phê duyệt' });
    }

    // 4. Tạo yêu cầu mới
    const newRequest = await prisma.programRequest.create({
        data: {
            user_id: userId,
            program_id: parseInt(programId),
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
                title: 'Yêu cầu phê duyệt lộ trình mới',
                message: `Học viên ${student.full_name || student.username} đã gửi yêu cầu tham gia lộ trình "${program.title}".`,
                type: 'NEW_PROGRAM_REQUEST',
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
 * Lấy danh sách yêu cầu đang chờ (Dành cho Admin/Manager)
 */
exports.getPendingRequests = catchAsync(async (req, res) => {
    const requests = await prisma.programRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            user: {
                select: { id: true, full_name: true, email: true, username: true }
            },
            program: {
                select: { id: true, title: true }
            }
        },
        orderBy: { created_at: 'asc' }
    });
    res.json(requests);
});

/**
 * Phê duyệt yêu cầu chương trình học
 * KHI PHÊ DUYỆT: Tự động mở khóa toàn bộ khóa học bên trong
 */
exports.approveRequest = catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await prisma.programRequest.findUnique({
        where: { id: parseInt(id) },
        include: {
            program: {
                include: {
                    courses: true
                }
            }
        }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    // 1. Cập nhật trạng thái yêu cầu
    const updatedRequest = await prisma.programRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED' }
    });

    // 2. Tạo ProgramEnrollment để cấp quyền truy cập chương trình
    await prisma.programEnrollment.upsert({
        where: {
            user_id_program_id: {
                user_id: request.user_id,
                program_id: request.program_id
            }
        },
        update: {},
        create: {
            user_id: request.user_id,
            program_id: request.program_id
        }
    });

    // 3. TỰ ĐỘNG CẤP QUYỀN TRUY CẬP CHO TOÀN BỘ KHÓA HỌC TRONG CHƯƠNG TRÌNH
    const courseEnrollments = request.program.courses.map(pc => {
        return prisma.enrollment.upsert({
            where: {
                user_id_course_id: {
                    user_id: request.user_id,
                    course_id: pc.course_id
                }
            },
            update: {},
            create: {
                user_id: request.user_id,
                course_id: pc.course_id
            }
        });
    });

    await Promise.all(courseEnrollments);

    // 3.5. XÓA CÁC YÊU CẦU KHÓA HỌC TRÙNG LẶP (Vì đã được mở qua chương trình)
    const programCourseIds = request.program.courses.map(pc => pc.course_id);
    await prisma.courseRequest.deleteMany({
        where: {
            user_id: request.user_id,
            course_id: { in: programCourseIds }
        }
    });

    // 4. Thông báo cho người dùng

    await notificationService.createNotification({
        userId: request.user_id,
        title: 'Yêu cầu lộ trình học được phê duyệt',
        message: `Yêu cầu tham gia lộ trình "${request.program.title}" của bạn đã được phê duyệt. Toàn bộ khóa học trong lộ trình đã được mở khóa.`,
        type: 'PROGRAM_APPROVAL',
        link: `/programs/${request.program_id}`
    });

    res.json({ message: 'Đã phê duyệt lộ trình và mở khóa toàn bộ khóa học liên quan', data: updatedRequest });
});

/**
 * Từ chối yêu cầu
 */
exports.rejectRequest = catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await prisma.programRequest.findUnique({
        where: { id: parseInt(id) },
        include: { program: true }
    });

    if (!request) throw new ApiError(404, 'Không tìm thấy yêu cầu');
    if (request.status !== 'PENDING') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
    }

    const updatedRequest = await prisma.programRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'REJECTED' }
    });

    // Thông báo cho người dùng
    await notificationService.createNotification({
        userId: request.user_id,
        title: 'Yêu cầu lộ trình học bị từ chối',
        message: `Yêu cầu tham gia lộ trình "${request.program.title}" của bạn đã bị từ chối.`,
        type: 'PROGRAM_REJECTION',
        link: `/programs/${request.program_id}`
    });

    res.json({ message: 'Đã từ chối yêu cầu truy cập lộ trình', data: updatedRequest });
});

exports.approveBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const requests = await prisma.programRequest.findMany({
        where: { id: { in: ids.map(id => parseInt(id)) }, status: 'PENDING' },
        include: { program: { include: { courses: true } } }
    });

    for (const request of requests) {
        await prisma.programRequest.update({
            where: { id: request.id },
            data: { status: 'APPROVED' }
        });

        await prisma.programEnrollment.upsert({
            where: { user_id_program_id: { user_id: request.user_id, program_id: request.program_id } },
            update: {},
            create: { user_id: request.user_id, program_id: request.program_id }
        });

        for (const pc of request.program.courses) {
            await prisma.enrollment.upsert({
                where: { user_id_course_id: { user_id: request.user_id, course_id: pc.course_id } },
                update: {},
                create: { user_id: request.user_id, course_id: pc.course_id }
            });
        }

        // Xóa yêu cầu khóa học trùng lặp
        const pCourseIds = request.program.courses.map(pc => pc.course_id);
        await prisma.courseRequest.deleteMany({
            where: { user_id: request.user_id, course_id: { in: pCourseIds } }
        });

        await notificationService.createNotification({
            userId: request.user_id,
            title: 'Yêu cầu lộ trình học được phê duyệt',
            message: `Yêu cầu tham gia lộ trình "${request.program.title}" của bạn đã được phê duyệt.`,
            type: 'PROGRAM_APPROVAL',
            link: `/programs/${request.program_id}`
        });
    }

    res.json({ message: `Đã phê duyệt ${requests.length} yêu cầu lộ trình` });
});

exports.rejectBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const requests = await prisma.programRequest.findMany({
        where: { id: { in: ids.map(id => parseInt(id)) }, status: 'PENDING' },
        include: { program: true }
    });

    for (const request of requests) {
        await prisma.programRequest.update({
            where: { id: request.id },
            data: { status: 'REJECTED' }
        });

        await notificationService.createNotification({
            userId: request.user_id,
            title: 'Yêu cầu lộ trình học bị từ chối',
            message: `Yêu cầu tham gia lộ trình "${request.program.title}" của bạn đã bị từ chối.`,
            type: 'PROGRAM_REJECTION',
            link: `/programs/${request.program_id}`
        });
    }

    res.json({ message: `Đã từ chối ${requests.length} yêu cầu lộ trình` });
});


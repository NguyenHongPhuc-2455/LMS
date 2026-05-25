const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { lessonSelect } = require('./video.service');

const { _checkCourseAccess, _getCompletedLessonIds, _enrichSections, _calculateCourseProgress } = require('./course/courseDetail.helpers');
const { getMandatoryOverdueReport } = require('./course/mandatoryReport.service');

const { isUserInScope } = require('../utils/scope');

const isUserInCourseScope = (userData, course, isEnrolled = false, departmentMap = null) => {
    return isUserInScope(userData, course, isEnrolled, departmentMap);
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Chuẩn hoá boolean từ query string hoặc giá trị JS */
const toBool = (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return val === true || val === 'true';
};

/** Xây dựng mệnh đề WHERE dùng chung cho mọi query course */
const buildCourseWhere = ({ search, categoryId, includeInactive, privateFilter, activeFilter, levelFilter }) => ({
    ...(toBool(includeInactive) !== true && { deleted_at: null }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(categoryId !== undefined && categoryId !== null && categoryId !== '' && {
        category_id: parseInt(categoryId) === -1 ? null : parseInt(categoryId)
    }),
    ...(toBool(privateFilter) !== undefined && { is_private: toBool(privateFilter) }),
    ...(activeFilter !== undefined && activeFilter !== null && activeFilter !== '' && (
        toBool(activeFilter) ? { deleted_at: null } : { deleted_at: { not: null } }
    )),
    ...(levelFilter && (Array.isArray(levelFilter) ? levelFilter.length > 0 : true) && {
        level: { in: Array.isArray(levelFilter) ? levelFilter : [levelFilter] }
    })
});

/** Xây dựng mảng orderBy từ sortField / sortOrder */
const buildCourseOrderBy = (sortField, sortOrder) => {
    const SORT_MAP = {
        title: 'title',
        created_at: 'created_at',
        is_private: 'is_private',
        sections_count: 'sections',
        enrollments_count: 'enrollments'
    };
    const mapped = SORT_MAP[sortField] || null;
    const dir = sortOrder === 'ascend' ? 'asc' : sortOrder === 'descend' ? 'desc' : null;
    const orderBy = [];

    if (mapped === 'sections') {
        orderBy.push({ sections: { _count: dir || 'desc' } });
    } else if (mapped === 'enrollments') {
        orderBy.push({ enrollments: { _count: dir || 'desc' } });
    } else if (mapped && dir) {
        orderBy.push({ [mapped]: dir });
    }
    orderBy.push({ updated_at: 'desc' });
    return orderBy;
};

/** Include chuẩn cho danh sách khóa học */
const COURSE_LIST_INCLUDE = {
    category: true,
    instructor: { select: { id: true, username: true, full_name: true, email: true, phone: true } },
    _count: { select: { sections: true, enrollments: true } }
};

// ─── Main service ────────────────────────────────────────────────────────────

const getAllCourses = async (
    search = '',
    categoryId = null,
    includeInactive = false,
    user = null,
    page = null,
    limit = null,
    options = {}
) => {
    const { sortField, sortOrder, privateFilter, activeFilter, levelFilter } = options;
    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('instructor');

    const where = buildCourseWhere({ search, categoryId, includeInactive, privateFilter, activeFilter, levelFilter });
    const orderBy = buildCourseOrderBy(sortField, sortOrder);

    // ── Admin: server-side pagination thật, không cần lọc scope ──────────────
    if (isAdmin) {
        if (page !== null && limit !== null) {
            const [courses, total] = await Promise.all([
                prisma.course.findMany({
                    where,
                    include: COURSE_LIST_INCLUDE,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy
                }),
                prisma.course.count({ where })
            ]);
            return { courses, total };
        }
        // Không paginate — trả toàn bộ (dùng cho export, v.v.)
        return prisma.course.findMany({ where, include: COURSE_LIST_INCLUDE, orderBy });
    }

    // ── Non-admin: cần lọc theo scope trước, sau đó paginate ─────────────────
    // Lấy dữ liệu user + enrollment song song để tránh waterfall
    const [userData, directEnrollments, programEnrollments, depts] = await Promise.all([
        user ? prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, department_id: true, position_id: true, join_date: true }
        }) : Promise.resolve(null),
        user ? prisma.enrollment.findMany({
            where: { user_id: user.id },
            select: { course_id: true }
        }) : Promise.resolve([]),
        user ? prisma.programEnrollment.findMany({
            where: { user_id: user.id },
            include: { program: { include: { courses: { select: { course_id: true } } } } }
        }) : Promise.resolve([]),
        prisma.department.findMany({ select: { id: true, parent_id: true } })
    ]);

    const enrolledCourseIds = new Set([
        ...directEnrollments.map(e => e.course_id),
        ...programEnrollments.flatMap(pe => pe.program.courses.map(pc => pc.course_id))
    ]);
    const departmentMap = new Map(depts.map(d => [d.id, d.parent_id]));

    // Fetch toàn bộ để lọc scope (không thể đẩy scope filter xuống DB vì logic phức tạp)
    const allCourses = await prisma.course.findMany({
        where,
        include: COURSE_LIST_INCLUDE,
        orderBy
    });

    const filtered = userData
        ? allCourses.filter(course =>
            isUserInCourseScope(userData, course, enrolledCourseIds.has(course.id), departmentMap)
          )
        : allCourses;

    if (page !== null && limit !== null) {
        return {
            courses: filtered.slice((page - 1) * limit, page * limit),
            total: filtered.length
        };
    }
    return filtered;
};

const getCourseById = async (courseId) => {
    return await prisma.course.findFirst({
        where: {
            id: parseInt(courseId),
            deleted_at: null
        },
        include: {
            category: true,
            instructor: { select: { id: true, username: true, full_name: true, email: true, phone: true } },
            sections: {
                orderBy: [
                    { order: 'asc' },
                    { title: 'asc' },
                    { id: 'asc' }
                ],
                include: {
                    lessons: {
                        select: lessonSelect,
                        orderBy: [
                            { order: 'asc' },
                            { title: 'asc' },
                            { id: 'asc' }
                        ]
                    }
                }
            }
        }
    });
};

/**
 * Lấy chi tiết khóa học đã được làm giàu dữ liệu (Tiến độ, Quyền truy cập, URL bảo mật)
 */
const getEnrichedCourseDetail = async (courseId, user, ip) => {
    const userId = user?.id;
    const course = await getCourseById(courseId);
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');

    // 1. Kiểm tra quyền truy cập cơ bản (Đã ghi danh/Admin/Chủ sở hữu)
    let { hasAccess, requestStatus, enrolledAt } = await _checkCourseAccess(userId, parseInt(courseId), course.instructor_id, user?.roles);

    // 2. Tính toán trạng thái thời hạn và quyền truy cập đặc biệt (Early Access/Overdue)
    const { calculateCourseStatus } = require('../utils/courseStatus');
    const userData = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, join_date: true, department_id: true, position_id: true } }) : null;

    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('instructor');
    const isOwner = course.instructor_id === userId;

    // 2.5. Kiểm tra phạm vi hiển thị (Visibility Scope)
    if (!isAdmin && !isOwner && userData) {
        const depts = await prisma.department.findMany({ select: { id: true, parent_id: true } });
        const departmentMap = new Map(depts.map(d => [d.id, d.parent_id]));
        const inScope = isUserInCourseScope(userData, course, hasAccess, departmentMap);
        if (!inScope) {
            throw new ApiError(403, 'Bạn không thuộc đối tượng được phân phối khóa học này.');
        }
    }

    // Lấy danh sách bài học đã hoàn thành để tính progress thực tế cho statusInfo
    const completedLessonIds = await _getCompletedLessonIds(userId, course);
    const allLessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
    const progressPercent = allLessonIds.length > 0 ? Math.round((completedLessonIds.length / allLessonIds.length) * 100) : 0;

    const statusInfo = calculateCourseStatus(course, userData, progressPercent, enrolledAt);

    // 3. Kiểm tra khóa theo lộ trình học tuần tự (Sequential learning lock)
    let isLockedByProgram = false;
    let lockReason = '';

    if (userId && !isAdmin && !isOwner) {
        // Tìm tất cả lộ trình học mà nhân viên này đã đăng ký và chứa khóa học này
        const programEnrollments = await prisma.programEnrollment.findMany({
            where: {
                user_id: userId,
                program: {
                    deleted_at: null,
                    allow_early_access: false, // Chỉ xét lộ trình học bắt buộc học tuần tự
                    courses: {
                        some: { course_id: parseInt(courseId) }
                    }
                }
            },
            include: {
                program: {
                    include: {
                        courses: {
                            orderBy: { order: 'asc' },
                            include: {
                                course: {
                                    include: {
                                        sections: {
                                            include: {
                                                lessons: { select: { id: true } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (programEnrollments.length > 0) {
            // Lấy tất cả bài học đã hoàn thành của user một lần duy nhất
            const userCompletions = await prisma.lessonCompleted.findMany({
                where: { user_id: userId },
                select: { lesson_id: true }
            });
            const completedSet = new Set(userCompletions.map(c => c.lesson_id));

            for (const pe of programEnrollments) {
                const sortedCourses = pe.program.courses;
                const currentIndex = sortedCourses.findIndex(pc => pc.course_id === parseInt(courseId));

                if (currentIndex > 0) {
                    // Kiểm tra xem tất cả các khóa học đứng trước đã hoàn thành chưa
                    for (let i = 0; i < currentIndex; i++) {
                        const prevCourse = sortedCourses[i].course;
                        const prevLessonIds = prevCourse.sections.flatMap(s => s.lessons.map(l => l.id));

                        const total = prevLessonIds.length;
                        const completed = prevLessonIds.filter(id => completedSet.has(id)).length;
                        const isFinished = total === 0 || completed === total;

                        if (!isFinished) {
                            isLockedByProgram = true;
                            lockReason = `Cần hoàn thành khóa học "${prevCourse.title}".`;
                            break;
                        }
                    }
                }
                if (isLockedByProgram) break;
            }
        }
    }

    if (isLockedByProgram) {
        statusInfo.canAccess = false;
        statusInfo.reason = lockReason;
    }

    // Nếu là học viên (không phải admin/owner) và canAccess = false, thì chặn hasAccess
    if (!isAdmin && !isOwner && !statusInfo.canAccess) {
        hasAccess = false;
    }

    // 4. Làm giàu dữ liệu cho từng Lesson
    course.sections = _enrichSections(course.sections, userId, ip, hasAccess && !statusInfo.isOverdue, completedLessonIds, statusInfo.isOverdue);

    // 5. Tính toán tiến độ
    const progress = _calculateCourseProgress(course, completedLessonIds, userId, hasAccess && !statusInfo.isOverdue);

    return {
        ...course,
        hasAccess,
        requestStatus,
        isOverdue: statusInfo.isOverdue,
        status: statusInfo.status,
        remainingDays: statusInfo.remainingDays,
        canAccess: statusInfo.canAccess,
        accessReason: statusInfo.reason,
        deadlineDate: statusInfo.deadlineDate,
        ...progress
    };
};

// --- Private Helper Functions ---


const restoreCourse = async (courseId) => {
    const id = parseInt(courseId);
    return await prisma.course.update({
        where: { id },
        data: {
            deleted_at: null,
            status: 'PUBLISHED'
        }
    });
};

const toggleActiveStatus = async (courseId, active) => {
    const id = parseInt(courseId);
    return await prisma.course.update({
        where: { id },
        data: {
            deleted_at: active ? null : new Date()
        }
    });
};

const softDeleteCourse = async (courseId) => {
    const id = parseInt(courseId);

    // 1. Lấy toàn bộ lesson IDs để dọn tài nguyên R2
    const lessons = await prisma.lesson.findMany({
        where: { section: { course_id: id } },
        select: { id: true }
    });

    // Xóa file vật lý song song — không để lỗi 1 file chặn toàn bộ
    const videoService = require('./video.service');
    await Promise.allSettled(
        lessons.map(lesson => videoService.deleteVideoFiles(lesson.id))
    );

    // 2. Xóa cứng trong transaction (cascade xóa Section → Lesson → Quiz → Comment)
    return await prisma.$transaction(async (tx) => {
        await tx.programCourse.deleteMany({ where: { course_id: id } });
        await tx.enrollment.deleteMany({ where: { course_id: id } });
        await tx.courseRequest.deleteMany({ where: { course_id: id } });
        await tx.wishlist.deleteMany({ where: { course_id: id } });
        await tx.review.deleteMany({ where: { course_id: id } });
        await tx.section.deleteMany({ where: { course_id: id } });
        return tx.course.delete({ where: { id } });
    });
};

/**
 * Xóa nhiều khóa học song song — mỗi khóa học vẫn có transaction riêng
 * để lỗi 1 ID không ảnh hưởng các ID còn lại.
 */
const batchDeleteCourses = async (ids) => {
    const settled = await Promise.allSettled(ids.map(id => softDeleteCourse(id)));

    const results = settled.map((result, i) => ({
        id: ids[i],
        status: result.status === 'fulfilled' ? 'success' : 'error',
        ...(result.status === 'rejected' && { message: result.reason?.message })
    }));

    return {
        successCount: results.filter(r => r.status === 'success').length,
        results
    };
};
const createCourse = async (data) => {
    return await prisma.course.create({ data });
};

/**
 * Xóa một chương (Section) và dọn dẹp toàn bộ tài nguyên liên quan
 */
const deleteSection = async (id) => {
    const sectionId = parseInt(id);
    const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: { lessons: { select: { id: true } } }
    });

    if (!section) throw new ApiError(404, 'Không tìm thấy chương học');

    // Xóa file R2 song song
    const videoService = require('./video.service');
    await Promise.allSettled(
        section.lessons.map(lesson => videoService.deleteVideoFiles(lesson.id))
    );

    return prisma.section.delete({ where: { id: sectionId } });
};


module.exports = {
    getAllCourses,
    getCourseById,
    getEnrichedCourseDetail,
    createCourse,
    softDeleteCourse,
    batchDeleteCourses,
    deleteSection,
    restoreCourse,
    toggleActiveStatus,
    getMandatoryOverdueReport,
    isUserInCourseScope
};




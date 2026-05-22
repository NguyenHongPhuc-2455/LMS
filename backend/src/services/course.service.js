const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { lessonSelect } = require('./video.service');

const { _checkCourseAccess, _getCompletedLessonIds, _enrichSections, _calculateCourseProgress } = require('./course/courseDetail.helpers');
const { getMandatoryOverdueReport } = require('./course/mandatoryReport.service');

const { isUserInScope } = require('../utils/scope');

const isUserInCourseScope = (userData, course, isEnrolled = false, departmentMap = null) => {
    return isUserInScope(userData, course, isEnrolled, departmentMap);
};

const getAllCourses = async (search = '', categoryId = null, includeInactive = false, user = null, page = null, limit = null) => {
    let courses = await prisma.course.findMany({
        where: {
            ...(includeInactive !== true && includeInactive !== 'true' && { deleted_at: null }),
            ...(search && {
                title: { contains: search, mode: 'insensitive' }
            }),
            ...(categoryId !== undefined && categoryId !== null && categoryId !== '' && {
                category_id: parseInt(categoryId) === -1 ? null : parseInt(categoryId)
            })
        },
        include: {
            category: true,
            instructor: { select: { id: true, username: true, full_name: true, email: true, phone: true } },
            _count: { select: { sections: true, enrollments: true } }
        }
    });

    // Lọc các khóa học hiển thị theo Phạm vi áp dụng (Nếu không phải admin)
    if (user) {
        const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('instructor');
        if (!isAdmin) {
            const userData = await prisma.user.findUnique({
                where: { id: user.id },
                select: { id: true, department_id: true, position_id: true, join_date: true }
            });

            if (userData) {
                // Lấy tất cả course_id mà user đã ghi danh (trực tiếp hoặc qua lộ trình học)
                const [directEnrollments, programEnrollments] = await Promise.all([
                    prisma.enrollment.findMany({
                        where: { user_id: user.id },
                        select: { course_id: true }
                    }),
                    prisma.programEnrollment.findMany({
                        where: { user_id: user.id },
                        include: {
                            program: {
                                include: {
                                    courses: { select: { course_id: true } }
                                }
                            }
                        }
                    })
                ]);

                const enrolledCourseIds = new Set([
                    ...directEnrollments.map(e => e.course_id),
                    ...programEnrollments.flatMap(pe => pe.program.courses.map(pc => pc.course_id))
                ]);

                const depts = await prisma.department.findMany({ select: { id: true, parent_id: true } });
                const departmentMap = new Map(depts.map(d => [d.id, d.parent_id]));

                courses = courses.filter(course => {
                    const isEnrolled = enrolledCourseIds.has(course.id);
                    return isUserInCourseScope(userData, course, isEnrolled, departmentMap);
                });
            }
        }
    }

    if (page !== null && limit !== null) {
        const total = courses.length;
        const skip = (page - 1) * limit;
        const paginatedCourses = courses.slice(skip, skip + limit);
        return {
            courses: paginatedCourses,
            total
        };
    }

    return courses;
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

    // 1. Tìm toàn bộ bài học thuộc khóa học này để dọn dẹp tài nguyên (Video trên R2)
    const lessons = await prisma.lesson.findMany({
        where: { section: { course_id: id } },
        select: { id: true }
    });

    // Xóa file vật lý trên Cloudflare R2
    const videoService = require('./video.service');
    for (const lesson of lessons) {
        try {
            await videoService.deleteVideoFiles(lesson.id);
        } catch (error) {
            console.error(`Lỗi khi xóa video bài học ${lesson.id}:`, error);
        }
    }

    // 2. Thực hiện xóa cứng trong transaction
    return await prisma.$transaction(async (tx) => {
        // Xóa các liên kết trước
        await tx.programCourse.deleteMany({ where: { course_id: id } });
        await tx.enrollment.deleteMany({ where: { course_id: id } });
        await tx.courseRequest.deleteMany({ where: { course_id: id } });
        await tx.wishlist.deleteMany({ where: { course_id: id } });
        await tx.review.deleteMany({ where: { course_id: id } });

        // Xóa các chương học (sẽ cascade xóa Lesson, Quiz, Comment...)
        await tx.section.deleteMany({ where: { course_id: id } });

        // Cuối cùng là xóa vĩnh viễn khóa học
        return await tx.course.delete({
            where: { id }
        });
    });
};
const batchDeleteCourses = async (ids) => {
    const results = [];
    let successCount = 0;
    for (const id of ids) {
        try {
            await softDeleteCourse(id);
            results.push({ id, status: 'success' });
            successCount++;
        } catch (error) {
            console.error(`Lỗi khi xóa khóa học ${id}:`, error);
            results.push({ id, status: 'error', message: error.message });
        }
    }
    return { successCount, results };
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
        include: { lessons: true }
    });

    if (!section) throw new ApiError(404, 'Không tìm thấy chương học');

    // 1. Xóa file vật lý trên Cloudflare R2 cho toàn bộ bài học trong chương
    const videoService = require('./video.service');
    for (const lesson of section.lessons) {
        await videoService.deleteVideoFiles(lesson.id);
    }

    // 2. Xóa bản ghi trong DB (Cascade sẽ tự động xóa bản ghi Lesson, Quiz, Comment...)
    return await prisma.section.delete({
        where: { id: sectionId }
    });
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




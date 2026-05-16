const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { lessonSelect } = require('./video.service');

const { generateStreamToken } = require('../utils/streamToken');

const { NEW_EMPLOYEE_THRESHOLD_DAYS } = require('../constants/system');

const isUserInCourseScope = (userData, course, isEnrolled = false) => {
    if (isEnrolled) return true;

    const scope = course.apply_scope || 'ALL_EMPLOYEE';
    const targets = Array.isArray(course.mandatory_targets) ? course.mandatory_targets : [];
    
    // 1. Check New Employee status if needed
    const isNewScope = scope.startsWith('NEW_EMPLOYEE');
    if (isNewScope) {
        if (!userData.join_date) return false;
        const today = new Date();
        const joinDate = new Date(userData.join_date);
        const diffDays = Math.ceil((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > NEW_EMPLOYEE_THRESHOLD_DAYS) return false;
    }

    // 2. Check scope
    if (scope === 'ALL_EMPLOYEE' || scope === 'NEW_EMPLOYEE') return true;
    
    if (scope === 'BY_DEPARTMENT' || scope === 'NEW_EMPLOYEE_BY_DEPARTMENT') {
        return userData.department_id && targets.includes(userData.department_id);
    }
    
    if (scope === 'BY_POSITION' || scope === 'NEW_EMPLOYEE_BY_POSITION') {
        return userData.position_id && targets.includes(userData.position_id);
    }
    
    if (scope === 'SPECIFIC_USER') {
        return targets.includes(userData.id);
    }
    
    return true;
};

const getAllCourses = async (search = '', categoryId = null, includeInactive = false, user = null) => {
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
                courses = courses.filter(course => isUserInCourseScope(userData, course));
            }
        }
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
        const inScope = isUserInCourseScope(userData, course);
        if (!inScope) {
            throw new ApiError(403, 'Bạn không thuộc đối tượng được phân phối khóa học này.');
        }
    }

    // Lấy danh sách bài học đã hoàn thành để tính progress thực tế cho statusInfo
    const completedLessonIds = await _getCompletedLessonIds(userId, course);
    const allLessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
    const progressPercent = allLessonIds.length > 0 ? Math.round((completedLessonIds.length / allLessonIds.length) * 100) : 0;

    const statusInfo = calculateCourseStatus(course, userData, progressPercent, enrolledAt);

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

const _checkCourseAccess = async (userId, courseId, instructorId, roles = []) => {
    if (!userId) return { hasAccess: false, requestStatus: null };

    const isAdmin = roles.includes('admin');
    const isOwner = instructorId === userId;

    if (isAdmin || isOwner) return { hasAccess: true, requestStatus: null };

    const [enrollment, programEnrollment, reqAccess] = await Promise.all([
        prisma.enrollment.findUnique({ where: { user_id_course_id: { user_id: userId, course_id: courseId } } }),
        prisma.programEnrollment.findFirst({
            where: { user_id: userId, program: { courses: { some: { course_id: courseId } } } }
        }),
        prisma.courseRequest.findFirst({
            where: { user_id: userId, course_id: courseId },
            orderBy: { created_at: 'desc' }
        })
    ]);

    return {
        hasAccess: !!(enrollment || programEnrollment),
        requestStatus: reqAccess?.status || null,
        enrolledAt: enrollment?.enrolled_at || null
    };
};

const _getCompletedLessonIds = async (userId, course) => {
    if (!userId) return [];
    const allLessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
    const completions = await prisma.lessonCompleted.findMany({
        where: { user_id: userId, lesson_id: { in: allLessonIds } },
        select: { lesson_id: true }
    });
    return completions.map(c => c.lesson_id);
};

const _enrichSections = (sections, userId, ip, hasAccess, completedLessonIds, isOverdue = false) => {
    return sections.map(s => ({
        ...s,
        lessons: s.lessons.map(l => {
            let securedVideoUrl = l.video_url;
            const canView = hasAccess || l.is_free;

            if (canView && securedVideoUrl && !isOverdue) {
                if (securedVideoUrl.startsWith('/public/hls/') || securedVideoUrl.startsWith('hls/')) {
                    const token = generateStreamToken(userId, l.id, ip);
                    const fileName = securedVideoUrl.split('/').pop();
                    const finalFileName = (fileName && fileName.includes('.m3u8')) ? fileName : 'master.m3u8';
                    securedVideoUrl = `/api/videos/stream/${token}/${finalFileName}`;
                }
            }

            return {
                ...l,
                isCompleted: completedLessonIds.includes(l.id),
                video_url: (canView && !isOverdue) ? securedVideoUrl : null,
                ...((!canView || isOverdue) && { content: isOverdue ? 'Khóa học này đã bị khóa do quá hạn.' : 'Nội dung này đã bị khóa.' })
            };
        })
    }));
};

const _calculateCourseProgress = (course, completedLessonIds, userId, hasAccess) => {
    if (!userId || !hasAccess) return { nextLessonId: null, isCourseFinished: false };

    const allLessons = course.sections.flatMap(s => s.lessons);
    if (allLessons.length === 0) return { nextLessonId: null, isCourseFinished: false };

    const nextLesson = allLessons.find(l => !completedLessonIds.includes(l.id));

    return {
        nextLessonId: nextLesson ? nextLesson.id : allLessons[0].id,
        isCourseFinished: completedLessonIds.length === allLessons.length
    };
};

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

const getMandatoryOverdueReport = async (type = 'overdue') => {
    // 1. Lấy tất cả khóa học bắt buộc
    const mandatoryCourses = await prisma.course.findMany({
        where: { is_mandatory: true, deleted_at: null },
        select: { 
            id: true, title: true, mandatory_deadline_days: true, 
            mandatory_start_date: true, mandatory_end_date: true, 
            allow_early_access: true, apply_scope: true, mandatory_targets: true 
        }
    });

    if (mandatoryCourses.length === 0) return [];

    // 2. Lấy tất cả user có join_date
    const users = await prisma.user.findMany({
        where: { join_date: { not: null }, deleted_at: null },
        select: { 
            id: true, full_name: true, email: true, phone: true, 
            employee_id: true, join_date: true, department_id: true, 
            position_id: true, department: { select: { name: true } } 
        }
    });

    const { calculateCourseStatus } = require('../utils/courseStatus');
    const resultList = [];
    const today = new Date();

    for (const user of users) {
        const userCourses = [];


        const enrollments = await prisma.enrollment.findMany({
            where: { user_id: user.id, course_id: { in: mandatoryCourses.map(c => c.id) } },
            select: { course_id: true, enrolled_at: true }
        });
        const enrollmentMap = {};
        enrollments.forEach(e => { enrollmentMap[e.course_id] = e.enrolled_at; });

        for (const course of mandatoryCourses) {
            const isEnrolled = !!enrollmentMap[course.id];
            if (!isUserInCourseScope(user, course, isEnrolled)) continue;

            const statusInfo = calculateCourseStatus(course, user, 0, enrollmentMap[course.id]);

            // Kiểm tra tiến độ thực tế
            const lessons = await prisma.lesson.findMany({
                where: { section: { course_id: course.id } },
                select: { id: true }
            });
            const lessonIds = lessons.map(l => l.id);

            let isCompleted = false;
            let progress = 0;
            if (lessonIds.length > 0) {
                const completedCount = await prisma.lessonCompleted.count({
                    where: { user_id: user.id, lesson_id: { in: lessonIds } }
                });
                isCompleted = completedCount === lessonIds.length;
                progress = Math.round((completedCount / lessonIds.length) * 100);
            }

            // Phân loại
            const isOverdue = !isCompleted && statusInfo.isOverdue;
            const isOnTime = isCompleted || (!statusInfo.isOverdue);

            if (type === 'overdue' && isOverdue) {
                userCourses.push({ 
                    courseId: course.id, 
                    courseTitle: course.title, 
                    daysOverdue: Math.abs(statusInfo.remainingDays),
                    progress 
                });
            } else if (type === 'ontime' && isOnTime) {
                userCourses.push({ 
                    courseId: course.id, 
                    courseTitle: course.title, 
                    isCompleted,
                    progress,
                    remainingDays: statusInfo.remainingDays
                });
            }
        }

        if (userCourses.length > 0) {
            resultList.push({
                userId: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                employeeId: user.employee_id,
                department: user.department?.name,
                joinDate: user.join_date,
                courses: userCourses
            });
        }
    }

    return resultList;
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




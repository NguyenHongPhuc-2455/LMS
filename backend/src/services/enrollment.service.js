const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { calculateCourseStatus } = require('../utils/courseStatus');

const { NEW_EMPLOYEE_THRESHOLD_DAYS } = require('../constants/system');

/**
 * Lấy danh sách khóa học của người dùng kèm tiến độ
 */
const getUserEnrollments = async (userId) => {
    const enrollments = await prisma.enrollment.findMany({
        where: {
            user_id: userId,
            course: {
                deleted_at: null
            }
        },
        include: {
            course: {
                include: {
                    instructor: {
                        select: { full_name: true }
                    },
                    sections: {
                        orderBy: { order: 'asc' },
                        include: {
                            lessons: {
                                select: { id: true, order: true },
                                orderBy: [
                                    { order: 'asc' },
                                    { id: 'asc' }
                                ]
                            }
                        }
                    }
                }
            }
        }
    });

    const allLessonIds = enrollments.flatMap(e =>
        e.course.sections.flatMap(s => s.lessons.map(l => l.id))
    );

    const allCompletions = await prisma.lessonCompleted.findMany({
        where: {
            user_id: userId,
            lesson_id: { in: allLessonIds }
        },
        orderBy: { completed_at: 'desc' }
    });

    const completedSet = new Set(allCompletions.map(c => c.lesson_id));

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { join_date: true }
    });

    const coursesWithProgress = enrollments.map((e) => {
        const course = e.course;
        const lessons = course.sections.flatMap(s => s.lessons);
        const totalLessons = lessons.length;
        const completedCount = lessons.filter(l => completedSet.has(l.id)).length;
        const nextLesson = lessons.find(l => !completedSet.has(l.id));

        const lastCompletionForCourse = allCompletions.find(c =>
            lessons.some(l => l.id === c.lesson_id)
        );

        const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
        const statusInfo = calculateCourseStatus(course, user, progressPercent, e.enrolled_at);

        return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            instructor: course.instructor.full_name,
            totalLessons,
            completedLessons: completedCount,
            progressPercent,
            nextLessonId: nextLesson ? nextLesson.id : (lessons[0]?.id || null),
            enrolledAt: e.enrolled_at,
            lastActivity: lastCompletionForCourse?.completed_at || e.enrolled_at,
            isOverdue: statusInfo.isOverdue,
            status: statusInfo.status,
            deadlineDate: statusInfo.deadlineDate,
            canAccess: statusInfo.canAccess,
            reason: statusInfo.reason
        };
    }).filter(c => c.canAccess !== false);

    return coursesWithProgress.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
};

/**
 * Đăng ký khóa học cho người dùng
 */
const enrollUserToCourse = async (userId, courseId) => {
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');
    if (course.is_private) throw new ApiError(400, 'Khóa học này là riêng tư');

    if (course.is_mandatory) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { join_date: true } });
        const statusInfo = calculateCourseStatus(course, user, 0);

        if (!statusInfo.canAccess) {
            throw new ApiError(403, statusInfo.reason || 'Khóa học chưa đến thời gian cho phép truy cập');
        }
    }

    return await prisma.enrollment.upsert({
        where: { user_id_course_id: { user_id: userId, course_id: parseInt(courseId) } },
        update: {},
        create: { user_id: userId, course_id: parseInt(courseId) }
    });
};

/**
 * Đánh dấu hoàn thành bài học
 */
const markLessonAsCompleted = async (userId, lessonId, isAdminOrOwner = false) => {
    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: { section: true }
    });

    if (!lesson) throw new ApiError(404, 'Không tìm thấy bài học');

    if (!lesson.is_free && !isAdminOrOwner) {
        const [enrollment, programEnrollment] = await Promise.all([
            prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: userId, course_id: lesson.section.course_id } }
            }),
            prisma.programEnrollment.findFirst({
                where: { user_id: userId, program: { courses: { some: { course_id: lesson.section.course_id } } } }
            })
        ]);

        if (!enrollment && !programEnrollment) {
            throw new ApiError(403, 'Bạn không thể hoàn thành bài học của khóa học chưa đăng ký');
        }
    }

    return await prisma.lessonCompleted.upsert({
        where: {
            user_id_lesson_id: {
                user_id: userId,
                lesson_id: parseInt(lessonId)
            }
        },
        update: { completed_at: new Date() },
        create: {
            user_id: userId,
            lesson_id: parseInt(lessonId)
        }
    });
};

/**
 * Lấy danh sách khóa học bắt buộc của user
 */
const getMandatoryCoursesForUser = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            join_date: true,
            department_id: true,
            position_id: true,
            user_roles: {
                include: { role: true }
            }
        }
    });

    if (!user) return [];

    const roles = (user.user_roles || []).map(ur => ur.role.name.toLowerCase());
    if (roles.includes('admin') || roles.includes('manager')) {
        return [];
    }

    if (!user.join_date) return [];

    const { isUserInCourseScope } = require('./course.service');

    let mandatoryCourses = await prisma.course.findMany({
        where: { is_mandatory: true, deleted_at: null },
        include: {
            instructor: { select: { full_name: true } },
            _count: { select: { sections: true } }
        }
    });

    const enrollments = await prisma.enrollment.findMany({
        where: { user_id: userId, course_id: { in: mandatoryCourses.map(c => c.id) } },
        select: { course_id: true, enrolled_at: true }
    });
    const enrollmentMap = {};
    enrollments.forEach(e => { enrollmentMap[e.course_id] = e.enrolled_at; });

    mandatoryCourses = mandatoryCourses.filter(course => {
        const isEnrolled = !!enrollmentMap[course.id];
        return isUserInCourseScope(user, course, isEnrolled);
    });

    const allLessons = await prisma.lesson.findMany({
        where: { section: { course: { is_mandatory: true, deleted_at: null } } },
        select: { id: true, section: { select: { course_id: true } } }
    });

    const completedLessonIds = new Set(
        (await prisma.lessonCompleted.findMany({
            where: { user_id: userId, lesson_id: { in: allLessons.map(l => l.id) } },
            select: { lesson_id: true }
        })).map(c => c.lesson_id)
    );

    return mandatoryCourses.map(course => {
        const courseLessons = allLessons.filter(l => l.section.course_id === course.id);
        const totalLessons = courseLessons.length;
        const completedCount = courseLessons.filter(l => completedLessonIds.has(l.id)).length;
        const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

        const statusInfo = calculateCourseStatus(course, user, progressPercent, enrollmentMap[course.id]);

        return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            level: course.level,
            is_mandatory: true,
            mandatory_deadline_days: course.mandatory_deadline_days,
            deadlineDate: statusInfo.deadlineDate,
            remainingDays: statusInfo.remainingDays,
            progressPercent,
            completedLessons: completedCount,
            totalLessons,
            status: statusInfo.status,
            isOverdue: statusInfo.isOverdue,
            canAccess: statusInfo.canAccess,
            reason: statusInfo.reason,
            instructor: course.instructor,
            _count: course._count
        };
    }).filter(c => c.canAccess !== false);
};

module.exports = {
    getUserEnrollments,
    enrollUserToCourse,
    markLessonAsCompleted,
    getMandatoryCoursesForUser
};

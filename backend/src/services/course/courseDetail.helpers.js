const prisma = require('../../configs/prisma');
const { generateStreamToken } = require('../../utils/streamToken');

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

module.exports = {
    _checkCourseAccess,
    _getCompletedLessonIds,
    _enrichSections,
    _calculateCourseProgress
};

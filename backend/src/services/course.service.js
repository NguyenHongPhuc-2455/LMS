const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');
const { lessonSelect } = require('./video.service');

const { generateStreamToken } = require('../utils/streamToken');

const getAllCourses = async (search = '', categoryId = null) => {
    return await prisma.course.findMany({
        where: {
            deleted_at: null,
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

    // 1. Kiểm tra quyền truy cập
    const { hasAccess, requestStatus } = await _checkCourseAccess(userId, parseInt(courseId), course.instructor_id, user?.roles);

    // 2. Kiểm tra quá hạn
    let isOverdue = false;
    if (course.is_mandatory && userId) {
        const userData = await prisma.user.findUnique({ where: { id: userId }, select: { join_date: true } });
        if (userData?.join_date) {
            const deadline = new Date(userData.join_date);
            deadline.setDate(deadline.getDate() + (course.mandatory_deadline_days || 0));
            isOverdue = new Date() > deadline;
        }
    }

    // 3. Lấy danh sách bài học đã hoàn thành
    const completedLessonIds = await _getCompletedLessonIds(userId, course);

    // 4. Làm giàu dữ liệu cho từng Lesson
    course.sections = _enrichSections(course.sections, userId, ip, hasAccess && !isOverdue, completedLessonIds, isOverdue);

    // 5. Tính toán tiến độ
    const progress = _calculateCourseProgress(course, completedLessonIds, userId, hasAccess && !isOverdue);

    return { 
        ...course, 
        hasAccess, 
        requestStatus,
        isOverdue,
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
        requestStatus: reqAccess?.status || null
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
        await videoService.deleteVideoFiles(lesson.id);
    }

    // 2. Thực hiện xóa trong transaction
    return await prisma.$transaction(async (tx) => {
        // 0. Xóa khỏi toàn bộ lộ trình học liên quan
        await tx.programCourse.deleteMany({
            where: { course_id: id }
        });

        // 1. Dọn dẹp ghi danh và yêu cầu để đồng bộ dữ liệu quản lý User
        await tx.enrollment.deleteMany({
            where: { course_id: id }
        });

        await tx.courseRequest.deleteMany({
            where: { course_id: id }
        });

        // 2. Xóa cứng các chương (Section)
        await tx.section.deleteMany({
            where: { course_id: id }
        });


        // Xóa mềm khóa học
        return await tx.course.update({
            where: { id },
            data: {
                deleted_at: new Date(),
                status: 'ARCHIVED' // Chuyển trạng thái sang lưu trữ
            }
        });
    });
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
    deleteSection
};




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
            instructor: { select: { id: true, username: true, full_name: true } },
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
            instructor: { select: { id: true, username: true, full_name: true } },
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

    // 1. Lấy danh sách bài học đã hoàn thành
    let completedLessonIds = [];
    const allLessonIds = course.sections.flatMap(s => s.lessons.map(l => l.id));
    if (userId) {
        const completions = await prisma.lessonCompleted.findMany({
            where: { user_id: userId, lesson_id: { in: allLessonIds } },
            select: { lesson_id: true }
        });
        completedLessonIds = completions.map(c => c.lesson_id);
    }

    // 2. Kiểm tra quyền truy cập (Trực tiếp, qua Lộ trình, Admin/Chủ sở hữu)
    const isAdmin = user?.roles?.includes('admin');
    const isOwner = course.instructor_id === userId;
    let hasAccess = false;
    let requestStatus = null;

    if (userId) {
        const [enrollment, programEnrollment, reqAccess] = await Promise.all([
            prisma.enrollment.findUnique({ where: { user_id_course_id: { user_id: userId, course_id: parseInt(courseId) } } }),
            prisma.programEnrollment.findFirst({
                where: { user_id: userId, program: { courses: { some: { course_id: parseInt(courseId) } } } }
            }),
            prisma.courseRequest.findFirst({
                where: { user_id: userId, course_id: parseInt(courseId) },
                orderBy: { created_at: 'desc' }
            })
        ]);
        if (enrollment || programEnrollment || isAdmin || isOwner) hasAccess = true;
        if (reqAccess) requestStatus = reqAccess.status;
    }

    // 3. Bảo mật URL Video và cập nhật trạng thái bài học
    course.sections = course.sections.map(s => ({
        ...s,
        lessons: s.lessons.map(l => {
            let securedVideoUrl = l.video_url;
            if ((hasAccess || l.is_free) && securedVideoUrl) {
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
                video_url: (hasAccess || l.is_free) ? securedVideoUrl : null,
                ...(!hasAccess && !l.is_free && { content: 'Nội dung này đã bị khóa. Vui lòng liên hệ quản trị viên để mở khóa.' })
            };
        })
    }));

    // 4. Tính toán bài tiếp theo và trạng thái hoàn thành
    let nextLessonId = null;
    let isCourseFinished = false;
    if (userId && hasAccess) {
        const allLessons = course.sections.flatMap(s => s.lessons);
        const nextLesson = allLessons.find(l => !completedLessonIds.includes(l.id));
        nextLessonId = nextLesson ? nextLesson.id : (allLessons.length > 0 ? allLessons[0].id : null);
        isCourseFinished = allLessons.length > 0 && completedLessonIds.length === allLessons.length;
    }

    return { ...course, hasAccess, requestStatus, nextLessonId, isCourseFinished };
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

        // 1. Xóa cứng các chương (Section)
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




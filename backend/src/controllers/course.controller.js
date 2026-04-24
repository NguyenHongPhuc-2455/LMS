const prisma = require('../configs/prisma');
const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getCourses = catchAsync(async (req, res) => {
    const { search, categoryId } = req.query;
    const courses = await courseService.getAllCourses(search, categoryId);
    res.json(courses);
});

exports.getCourseDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const course = await courseService.getCourseById(id);
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');

    // Logic kiểm tra tiến độ và quyền truy cập
    let completedLessonIds = [];
    if (userId) {
        const completions = await prisma.lessonCompleted.findMany({
            where: { user_id: userId, lesson_id: { in: course.sections.flatMap(s => s.lessons.map(l => l.id)) } },
            select: { lesson_id: true }
        });
        completedLessonIds = completions.map(c => c.lesson_id);
    }

    const isAdmin = req.user?.roles?.includes('admin');
    const isOwner = course.instructor_id === userId;

    let hasAccess = false;
    if (userId) {
        // Kiểm tra quyền truy cập trực tiếp HOẶC thông qua Lộ trình học (Program)
        const [enrollment, programEnrollment] = await Promise.all([
            prisma.enrollment.findUnique({
                where: { user_id_course_id: { user_id: userId, course_id: parseInt(id) } }
            }),
            prisma.programEnrollment.findFirst({
                where: {
                    user_id: userId,
                    program: {
                        courses: {
                            some: { course_id: parseInt(id) }
                        }
                    }
                }
            })
        ]);

        if (enrollment || programEnrollment || isAdmin || isOwner) hasAccess = true;
    }

    let requestStatus = null;
    if (userId) {
        const reqAccess = await prisma.courseRequest.findFirst({
            where: { user_id: userId, course_id: parseInt(id) },
            orderBy: { created_at: 'desc' }
        });
        if (reqAccess) requestStatus = reqAccess.status;
    }

    // Transform lessons based on access
    course.sections = course.sections.map(s => ({
        ...s,
        lessons: s.lessons.map(l => ({
            ...l,
            isCompleted: completedLessonIds.includes(l.id),
            // Hide secure content if no access and not free
            ...(!hasAccess && !l.is_free && {
                video_url: null,
                content: 'Nội dung này đã bị khóa. Vui lòng liên hệ quản trị viên để mở khóa.'
            })
        }))
    }));

    // Calculate progress and next lesson
    let nextLessonId = null;
    let isCourseFinished = false;
    if (userId && hasAccess) {
        const allLessons = course.sections.flatMap(s => s.lessons);
        const nextLesson = allLessons.find(l => !completedLessonIds.includes(l.id));
        nextLessonId = nextLesson ? nextLesson.id : (allLessons.length > 0 ? allLessons[0].id : null);
        isCourseFinished = allLessons.length > 0 && completedLessonIds.length === allLessons.length;
    }

    res.json({ ...course, hasAccess, requestStatus, nextLessonId, isCourseFinished });

});

exports.createCourse = catchAsync(async (req, res) => {
    const { title, description, category_id, level, thumbnail, intro_video_url, learning_outcomes, requirements, is_private } = req.body;
    const course = await courseService.createCourse({
        title,
        description,
        is_private: is_private === true || is_private === 'true',
        category_id: category_id ? parseInt(category_id) : null,
        instructor_id: req.user.id,
        level,
        thumbnail,
        intro_video_url,
        learning_outcomes,
        requirements
    });
    res.status(201).json(course);
});

exports.updateCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, category_id, level, thumbnail, intro_video_url, learning_outcomes, requirements, is_private } = req.body;
    const course = await prisma.course.update({
        where: { id: parseInt(id) },
        data: {
            title,
            description,
            is_private: is_private !== undefined ? (is_private === true || is_private === 'true') : undefined,
            category_id: category_id ? parseInt(category_id) : undefined,
            level,
            thumbnail,
            intro_video_url,
            learning_outcomes,
            requirements,
            updated_at: new Date()
        }
    });
    res.json(course);
});

exports.deleteCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    await prisma.course.update({
        where: { id: parseInt(id) },
        data: { deleted_at: new Date() }
    });
    res.json({ message: 'Đã xóa khóa học' });
});

exports.createSection = catchAsync(async (req, res) => {
    const { course_id, title, order } = req.body;

    // Nếu không có order, tự động lấy số lượng hiện tại + 1 để đẩy xuống cuối
    let finalOrder = parseInt(order);
    if (isNaN(finalOrder)) {
        const count = await prisma.section.count({
            where: { course_id: parseInt(course_id) }
        });
        finalOrder = count + 1;
    }

    const section = await prisma.section.create({
        data: {
            title,
            course_id: parseInt(course_id),
            order: finalOrder
        }
    });
    res.status(201).json(section);
});

exports.deleteSection = catchAsync(async (req, res) => {
    const { id } = req.params;
    await prisma.section.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Đã xóa chương' });
});

exports.updateSection = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, order } = req.body;
    const section = await prisma.section.update({
        where: { id: parseInt(id) },
        data: {
            title,
            order: order !== undefined ? parseInt(order) : undefined
        }
    });
    res.json(section);
});

exports.getSectionDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const section = await prisma.section.findUnique({
        where: { id: parseInt(id) },
        include: {
            lessons: {
                orderBy: [
                    { order: 'asc' },
                    { id: 'asc' }
                ]
            }
        }
    });

    if (!section) throw new ApiError(404, 'Không tìm thấy chương học');
    res.json(section);
});

exports.getMyCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
        where: { user_id: userId },
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

    const coursesWithProgress = await Promise.all(enrollments.map(async (e) => {
        const course = e.course;
        const allLessons = course.sections.flatMap(s => s.lessons);
        const totalLessons = allLessons.length;

        const completedLessonsData = await prisma.lessonCompleted.findMany({
            where: {
                user_id: userId,
                lesson_id: { in: allLessons.map(l => l.id) }
            },
            select: { lesson_id: true }
        });
        const completedIdsItems = completedLessonsData.map(c => c.lesson_id);
        const completedLessons = completedIdsItems.length;

        // Tìm bài học đầu tiên chưa hoàn thành
        const nextLesson = allLessons.find(l => !completedIdsItems.includes(l.id));

        const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

        return {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            instructor: course.instructor.full_name,
            totalLessons,
            completedLessons,
            progressPercent,
            nextLessonId: nextLesson ? nextLesson.id : null,
            enrolledAt: e.enrolled_at
        };
    }));

    // Sắp xếp theo ngày tham gia mới nhất
    coursesWithProgress.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

    res.json(coursesWithProgress);
});

exports.enrollCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!course) throw new ApiError(404, 'Không tìm thấy khóa học');
    if (course.is_private) throw new ApiError(400, 'Khóa học này là riêng tư');
    const enrollment = await prisma.enrollment.upsert({
        where: { user_id_course_id: { user_id: userId, course_id: parseInt(id) } },
        update: {},
        create: { user_id: userId, course_id: parseInt(id) }
    });
    res.json({ message: 'Tham gia thành công', data: enrollment });
});

exports.completeLesson = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;

    if (!lessonId) throw new ApiError(400, 'Thiếu Lesson ID');

    const completion = await prisma.lessonCompleted.upsert({
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

    res.json({
        status: 'success',
        message: 'Lesson marked as completed',
        data: completion
    });
});

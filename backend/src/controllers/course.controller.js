const prisma = require('../configs/prisma');
const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getCourses = catchAsync(async (req, res) => {
    const { search } = req.query;
    const courses = await courseService.getAllCourses(search);
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
        const enrollment = await prisma.enrollment.findUnique({
            where: { user_id_course_id: { user_id: userId, course_id: parseInt(id) } }
        });
        if (enrollment || isAdmin || isOwner) hasAccess = true;
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
                content: course.is_private ? 'Khóa học này là riêng tư. Vui lòng gửi yêu cầu tham gia để xem nội dung.' : 'Vui lòng mua khóa học để xem nội dung này.'
            })
        }))
    }));

    res.json({ ...course, hasAccess, requestStatus });
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
                    _count: {
                        select: { sections: true }
                    }
                }
            }
        }
    });

    const courses = enrollments.map(e => ({
        ...e.course,
        enrolled_at: e.enrolled_at
    })).filter(c => !c.deleted_at);

    res.json(courses);
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

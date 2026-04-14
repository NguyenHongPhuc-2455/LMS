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

    // Transform lessons based on access
    course.sections = course.sections.map(s => ({
        ...s,
        lessons: s.lessons.map(l => ({
            ...l,
            isCompleted: completedLessonIds.includes(l.id),
            // Hide secure content if no access and not free
            ...(!hasAccess && !l.is_free && {
                video_url: null,
                content: 'Vui lòng mua khóa học để xem nội dung này.'
            })
        }))
    }));

    res.json({ ...course, hasAccess });
});

exports.createCourse = catchAsync(async (req, res) => {
    const { title, description, category_id, price, level, thumbnail, intro_video_url, learning_outcomes, requirements } = req.body;
    const course = await courseService.createCourse({
        title,
        description,
        category_id: category_id ? parseInt(category_id) : null,
        instructor_id: req.user.id,
        price: parseFloat(price) || 0,
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
    const { title, description, category_id, price, level, thumbnail, intro_video_url, learning_outcomes, requirements } = req.body;
    const course = await prisma.course.update({
        where: { id: parseInt(id) },
        data: {
            title,
            description,
            category_id: category_id ? parseInt(category_id) : undefined,
            price: price !== undefined ? parseFloat(price) : undefined,
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

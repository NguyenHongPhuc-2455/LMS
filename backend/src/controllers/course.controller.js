const prisma = require('../configs/prisma');
const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getCourses = catchAsync(async (req, res) => {
    const courses = await courseService.getAllCourses();
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
    const { title, description, category_id, price, level } = req.body;
    const course = await courseService.createCourse({
        title,
        description,
        category_id: category_id ? parseInt(category_id) : null,
        instructor_id: req.user.id,
        price: parseFloat(price) || 0,
        level
    });
    res.status(201).json(course);
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
    const section = await prisma.section.create({
        data: {
            ...req.body,
            course_id: parseInt(req.body.course_id),
            order: parseInt(req.body.order) || 0
        }
    });
    res.status(201).json(section);
});

exports.deleteSection = catchAsync(async (req, res) => {
    const { id } = req.params;
    await prisma.section.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Đã xóa chương' });
});

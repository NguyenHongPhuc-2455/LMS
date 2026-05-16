const catchAsync = require('../utils/catchAsync');
const enrollmentService = require('../services/enrollment.service');
const prisma = require('../configs/prisma');

/**
 * Lấy danh sách khóa học của tôi (đã ghi danh) kèm tiến độ
 */
exports.getMyCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const coursesWithProgress = await enrollmentService.getUserEnrollments(userId);
    res.json(coursesWithProgress);
});

/**
 * Đăng ký tham gia một khóa học
 */
exports.enrollCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const enrollment = await enrollmentService.enrollUserToCourse(userId, id);
    res.json({ message: 'Tham gia thành công', data: enrollment });
});

/**
 * Đánh dấu hoàn thành một bài học
 */
exports.completeLesson = catchAsync(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền (Admin hoặc Chủ khóa học)
    const isAdmin = req.user?.roles?.includes('admin');
    let isOwner = false;
    
    if (!isAdmin) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: parseInt(lessonId) },
            include: { section: true }
        });
        if (lesson) {
            const course = await prisma.course.findUnique({ 
                where: { id: lesson.section.course_id },
                select: { instructor_id: true }
            });
            isOwner = course?.instructor_id === userId;
        }
    }

    const completion = await enrollmentService.markLessonAsCompleted(userId, lessonId, isAdmin || isOwner);

    res.json({
        status: 'success',
        message: 'Lesson marked as completed',
        data: completion
    });
});

/**
 * Lấy danh sách khóa học bắt buộc kèm trạng thái deadline của user hiện tại
 */
exports.getMyMandatoryCourses = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await enrollmentService.getMandatoryCoursesForUser(userId);
    res.json(result);
});

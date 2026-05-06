const prisma = require('../configs/prisma');
const programService = require('../services/program.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getPrograms = catchAsync(async (req, res) => {
    const { search, status, instructorId } = req.query;
    const isAdmin = req.user?.roles?.includes('admin');
    const programs = await programService.getAllPrograms({
        search,
        status: isAdmin ? status : 'PUBLISHED',
        instructorId
    });
    res.json(programs);
});

exports.getProgramDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const program = await programService.getProgramById(id);
    if (!program) throw new ApiError(404, 'Không tìm thấy chương trình học');

    const userId = req.user?.id;
    let isEnrolled = false;
    let requestStatus = null;

    if (userId) {
        const [enrollment, request] = await Promise.all([
            prisma.programEnrollment.findUnique({
                where: { user_id_program_id: { user_id: userId, program_id: parseInt(id) } }
            }),
            prisma.programRequest.findFirst({
                where: { user_id: userId, program_id: parseInt(id) },
                orderBy: { created_at: 'desc' }
            })
        ]);
        isEnrolled = !!enrollment;
        requestStatus = request?.status || null;
    }

    // Nếu đã đăng ký, tính toán tiến độ để khóa/mở khóa các khóa học con
    if (isEnrolled && userId) {
        // Lấy toàn bộ tiến độ của user cho các khóa học trong chương trình này
        const sortedCourses = program.courses.sort((a, b) => a.order - b.order);
        let previousCourseFinished = true; // Khóa học đầu tiên luôn được mở

        for (let i = 0; i < sortedCourses.length; i++) {
            const courseId = sortedCourses[i].course.id;

            // Lấy danh sách bài học của khóa học này để tính tiến độ
            const lessons = await prisma.lesson.findMany({
                where: { section: { course_id: courseId } },
                select: { id: true }
            });

            const totalLessons = lessons.length;
            const lessonIds = lessons.map(l => l.id);
            const isAdminUser = req.user?.roles?.includes('admin');
            const isInstructor = program.instructor_id === userId;

            if (totalLessons === 0) {
                sortedCourses[i].isLocked = (isAdminUser || isInstructor) ? false : !previousCourseFinished;
                sortedCourses[i].progressPercent = 0; // Khóa học trống là 0%
                sortedCourses[i].isFinished = false;
                previousCourseFinished = false; // Chặn các khóa sau nếu khóa này trống
                continue;
            }

            // Đếm số bài đã hoàn thành
            const completedCount = lessonIds.length > 0 ? await prisma.lessonCompleted.count({
                where: {
                    user_id: userId,
                    lesson_id: { in: lessonIds }
                }
            }) : 0;

            const isFinished = totalLessons > 0 && completedCount === totalLessons;

            sortedCourses[i].isLocked = (isAdminUser || isInstructor) ? false : !previousCourseFinished;
            sortedCourses[i].progressPercent = Math.round((completedCount / totalLessons) * 100);
            sortedCourses[i].isFinished = isFinished;

            // Cập nhật trạng thái cho khóa học kế tiếp
            previousCourseFinished = isFinished;
        }
    }

    const currentCourse = isEnrolled ? program.courses.find(pc => !pc.isFinished)?.course : null;

    res.json({ ...program, isEnrolled, requestStatus, currentCourseId: currentCourse?.id || null });

});



exports.createProgram = catchAsync(async (req, res) => {
    const { title, description, level, thumbnail, is_private, status } = req.body;
    if (!title) throw new ApiError(400, 'Tiêu đề chương trình là bắt buộc');
    const program = await programService.createProgram({
        title,
        description,
        level,
        thumbnail,
        status: status || 'DRAFT',
        is_private: is_private === true || is_private === 'true',
        instructor_id: req.user.id
    });
    res.status(201).json(program);
});

exports.updateProgram = catchAsync(async (req, res) => {
    const { id } = req.params;
    const existing = await programService.getProgramById(id);
    if (!existing) throw new ApiError(404, 'Không tìm thấy chương trình học');

    const isAdmin = req.user?.roles?.includes('admin');
    if (!isAdmin && existing.instructor_id !== req.user.id) {
        throw new ApiError(403, 'Bạn không có quyền chỉnh sửa chương trình này');
    }

    const { title, description, level, thumbnail, status, is_private } = req.body;
    const updated = await programService.updateProgram(id, {
        title,
        description,
        level,
        thumbnail,
        status,
        ...(is_private !== undefined && { is_private: is_private === true || is_private === 'true' })
    });
    res.json(updated);
});

exports.deleteProgram = catchAsync(async (req, res) => {
    const { id } = req.params;
    const existing = await programService.getProgramById(id);
    if (!existing) throw new ApiError(404, 'Không tìm thấy chương trình học');
    await programService.softDeleteProgram(id);
    res.json({ message: 'Đã xóa chương trình học' });
});

exports.addCourseToProgram = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { course_id, order } = req.body;
    if (!course_id) throw new ApiError(400, 'course_id là bắt buộc');
    const item = await programService.addCourse(id, course_id, order);
    res.status(201).json(item);
});

exports.removeCourseFromProgram = catchAsync(async (req, res) => {
    const { id, courseId } = req.params;
    await programService.removeCourse(id, courseId);
    res.json({ message: 'Đã xóa khóa học khỏi chương trình' });
});

exports.enrollProgram = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const program = await programService.getProgramById(id);
    if (!program) throw new ApiError(404, 'Không tìm thấy chương trình học');
    if (program.is_private) throw new ApiError(400, 'Chương trình này là riêng tư');
    if (program.status !== 'PUBLISHED') throw new ApiError(400, 'Chương trình chưa được phát hành');

    await programService.enrollProgram(userId, id);
    res.json({ message: 'Đăng ký chương trình học thành công' });
});

exports.reorderProgramCourses = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { courses } = req.body; // Expecting [{ courseId: number, order: number }, ...]
    if (!courses || !Array.isArray(courses)) throw new ApiError(400, 'courses array là bắt buộc');
    await programService.reorderCourses(id, courses);
    res.json({ message: 'Đã cập nhật thứ tự khóa học' });
});

exports.getMyPrograms = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const programs = await programService.getMyPrograms(userId);

    // Tính toán tiến độ cho từng lộ trình
    const programsWithProgress = await Promise.all(programs.map(async (p) => {
        const sortedCourses = p.courses.sort((a, b) => a.order - b.order);
        let totalProgress = 0;
        const totalCourses = sortedCourses.length;

        for (const pc of sortedCourses) {
            const courseId = pc.course.id;
            const lessons = await prisma.lesson.findMany({
                where: { section: { course_id: courseId } },
                select: { id: true }
            });
            const totalLessons = lessons.length;
            if (totalLessons === 0) {
                totalProgress += 0; // Khóa học trống là 0%
                continue;
            }

            const completedCount = await prisma.lessonCompleted.count({
                where: {
                    user_id: userId,
                    lesson_id: { in: lessons.map(l => l.id) }
                }
            });

            totalProgress += (completedCount / totalLessons) * 100;
        }

        const progressPercent = totalCourses === 0 ? 0 : Math.round(totalProgress / totalCourses);

        return {
            ...p,
            progressPercent
        };
    }));

    res.json(programsWithProgress);
});

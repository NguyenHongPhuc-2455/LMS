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
    const program = await programService.getEnrichedProgramDetail(id, req.user);
    res.json(program);
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
    const { courses } = req.body;
    if (!courses || !Array.isArray(courses)) throw new ApiError(400, 'courses array là bắt buộc');
    await programService.reorderCourses(id, courses);
    res.json({ message: 'Đã cập nhật thứ tự khóa học' });
});

exports.getMyPrograms = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const programsWithProgress = await programService.getEnrichedMyPrograms(userId);
    res.json(programsWithProgress);
});


const prisma = require('../configs/prisma');
const programService = require('../services/program.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.getPrograms = catchAsync(async (req, res) => {
    const { search, status, instructorId } = req.query;
    const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('instructor');
    const programs = await programService.getAllPrograms({
        search,
        status: isAdmin ? status : 'PUBLISHED',
        instructorId,
        user: req.user
    });
    res.json(programs);
});

exports.getProgramDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const program = await programService.getEnrichedProgramDetail(id, req.user);
    res.json(program);
});

exports.createProgram = catchAsync(async (req, res) => {
    const { title, description, level, thumbnail, is_private, status,
            is_mandatory, apply_scope, mandatory_targets, mandatory_deadline_days,
            mandatory_start_date, mandatory_end_date, allow_early_access } = req.body;
            
    if (!title) throw new ApiError(400, 'Tiêu đề chương trình là bắt buộc');
    
    const isMandatoryVal = is_mandatory === true || is_mandatory === 'true';
    
    const program = await programService.createProgram({
        title,
        description,
        level,
        thumbnail,
        status: status || 'DRAFT',
        is_private: is_private === true || is_private === 'true',
        instructor_id: req.user.id,
        is_mandatory: isMandatoryVal,
        ...(isMandatoryVal && { mandatory_at: new Date() }),
        apply_scope: apply_scope || 'ALL_EMPLOYEE',
        mandatory_targets: mandatory_targets || null,
        mandatory_deadline_days: mandatory_deadline_days ? parseInt(mandatory_deadline_days) : 60,
        mandatory_start_date: mandatory_start_date ? new Date(mandatory_start_date) : null,
        mandatory_end_date: mandatory_end_date ? new Date(mandatory_end_date) : null,
        allow_early_access: allow_early_access !== undefined ? (allow_early_access === true || allow_early_access === 'true') : true
    });
    res.status(201).json(program);
});

exports.updateProgram = catchAsync(async (req, res) => {
    const { id } = req.params;
    const existing = await programService.getProgramById(id);
    if (!existing) throw new ApiError(404, 'Không tìm thấy chương trình học');

    const isAdmin = req.user?.roles?.includes('admin') || req.user?.roles?.includes('instructor');
    if (!isAdmin && existing.instructor_id !== req.user.id) {
        throw new ApiError(403, 'Bạn không có quyền chỉnh sửa chương trình này');
    }

    const { title, description, level, thumbnail, status, is_private,
            is_mandatory, apply_scope, mandatory_targets, mandatory_deadline_days,
            mandatory_start_date, mandatory_end_date, allow_early_access } = req.body;

    const isMandatoryVal = is_mandatory !== undefined ? (is_mandatory === true || is_mandatory === 'true') : undefined;

    // Ràng buộc thời hạn hoàn thành: Lộ trình >= Khóa học thành viên
    const targetMandDeadlineDays = mandatory_deadline_days !== undefined
        ? (mandatory_deadline_days ? parseInt(mandatory_deadline_days) : null)
        : undefined;

    if ((isMandatoryVal === true) || (isMandatoryVal !== false && existing.is_mandatory && targetMandDeadlineDays !== undefined)) {
        const finalMandatory = isMandatoryVal !== undefined ? isMandatoryVal : existing.is_mandatory;
        const finalDeadlineDays = targetMandDeadlineDays !== undefined ? targetMandDeadlineDays : existing.mandatory_deadline_days;

        if (finalMandatory && finalDeadlineDays !== null) {
            const programCourses = await prisma.programCourse.findMany({
                where: { program_id: parseInt(id) },
                include: { course: { select: { id: true, title: true, is_mandatory: true, mandatory_deadline_days: true } } }
            });

            for (const pc of programCourses) {
                if (pc.course.is_mandatory && pc.course.mandatory_deadline_days !== null) {
                    if (pc.course.mandatory_deadline_days > finalDeadlineDays) {
                        throw new ApiError(
                            400,
                            `Hạn hoàn thành của Lộ trình học (${finalDeadlineDays} ngày) không được ngắn hơn hạn hoàn thành của các khóa học thành viên (Khóa học "${pc.course.title}" yêu cầu ${pc.course.mandatory_deadline_days} ngày).`
                        );
                    }
                }
            }
        }
    }

    const updated = await programService.updateProgram(id, {
        title,
        description,
        level,
        thumbnail,
        status,
        ...(is_private !== undefined && { is_private: is_private === true || is_private === 'true' }),
        ...(is_mandatory !== undefined && { is_mandatory: isMandatoryVal }),
        ...(is_mandatory !== undefined && isMandatoryVal && { mandatory_at: new Date() }),
        ...(apply_scope !== undefined && { apply_scope }),
        ...(mandatory_targets !== undefined && { mandatory_targets }),
        ...(mandatory_deadline_days !== undefined && { mandatory_deadline_days: mandatory_deadline_days ? parseInt(mandatory_deadline_days) : null }),
        ...(mandatory_start_date !== undefined && { mandatory_start_date: mandatory_start_date ? new Date(mandatory_start_date) : null }),
        ...(mandatory_end_date !== undefined && { mandatory_end_date: mandatory_end_date ? new Date(mandatory_end_date) : null }),
        ...(allow_early_access !== undefined && { allow_early_access: allow_early_access === true || allow_early_access === 'true' })
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


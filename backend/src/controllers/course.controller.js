const prisma = require('../configs/prisma');
const courseService = require('../services/course.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generateStreamToken } = require('../utils/streamToken');
const { createVideoToken } = require('../utils/crypto');
const { lessonSelect } = require('../services/video.service');
const { notificationQueue } = require('../queues/notification.queue');

const getManagerDepartmentId = async (req) => {
    const userRoles = req.user?.roles || [];
    const roleNames = userRoles.map((r) => (typeof r === 'string' ? r : r.name).toLowerCase());
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');
    
    if (!isManagerOnly) return { isManagerOnly: false, departmentId: null };

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { department_id: true }
    });
    return { isManagerOnly: true, departmentId: user?.department_id || null };
};

exports.getCourses = catchAsync(async (req, res) => {
    const {
        search,
        categoryId,
        includeInactive,
        page,
        limit,
        sortField,
        sortOrder,
        privateFilter,
        activeFilter,
        levelFilter
    } = req.query;
    const courses = await courseService.getAllCourses(
        search,
        categoryId,
        includeInactive,
        req.user,
        page ? parseInt(page) : null,
        limit ? parseInt(limit) : null,
        {
            sortField,
            sortOrder,
            privateFilter,
            activeFilter,
            levelFilter
        }
    );
    res.json(courses);
});

exports.getCourseDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const course = await courseService.getEnrichedCourseDetail(id, req.user, req.ip);
    res.json(course);
});


exports.createCourse = catchAsync(async (req, res) => {
    const { title, description, category_id, level, thumbnail, intro_video_url, learning_outcomes, requirements, is_private, is_mandatory, mandatory_deadline_days, apply_scope, mandatory_targets, mandatory_start_date, mandatory_end_date, allow_early_access } = req.body;
    const isMandatoryVal = is_mandatory === true || is_mandatory === 'true';
    const course = await courseService.createCourse({
        title,
        description,
        is_private: is_private === true || is_private === 'true',
        is_mandatory: isMandatoryVal,
        mandatory_at: isMandatoryVal ? new Date() : null,
        apply_scope: apply_scope || 'ALL_EMPLOYEE',
        mandatory_targets: mandatory_targets ? mandatory_targets : null,
        mandatory_deadline_days: mandatory_deadline_days ? parseInt(mandatory_deadline_days) : 60,
        mandatory_start_date: mandatory_start_date ? new Date(mandatory_start_date) : null,
        mandatory_end_date: mandatory_end_date ? new Date(mandatory_end_date) : null,
        allow_early_access: allow_early_access !== undefined ? (allow_early_access === true || allow_early_access === 'true') : true,
        category_id: category_id ? parseInt(category_id) : null,
        instructor_id: req.user.id,
        level,
        thumbnail,
        intro_video_url,
        learning_outcomes,
        requirements
    });

    if (isMandatoryVal) {
        // Đẩy job tính toán và gửi thông báo vào Redis Queue thay vì xử lý đồng bộ
        notificationQueue.add('notify_course', {
            type: 'NOTIFY_MANDATORY_COURSE',
            payload: { courseId: course.id }
        }, { removeOnComplete: true, removeOnFail: false });
    }

    res.status(201).json(course);
});

exports.updateCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, description, category_id, level, thumbnail, intro_video_url, learning_outcomes, requirements, is_private, is_mandatory, mandatory_deadline_days, apply_scope, mandatory_targets, mandatory_start_date, mandatory_end_date, allow_early_access } = req.body;
    
    const existingCourse = await prisma.course.findUnique({ where: { id: parseInt(id) } });
    if (!existingCourse) throw new ApiError(404, 'Không tìm thấy khóa học');

    let mandatory_at = undefined;
    const isMandatoryVal = is_mandatory !== undefined ? (is_mandatory === true || is_mandatory === 'true') : undefined;
    
    if (isMandatoryVal !== undefined) {
        if (isMandatoryVal && !existingCourse.is_mandatory) {
            mandatory_at = new Date();
        } else if (!isMandatoryVal) {
            mandatory_at = null;
        }
    }

    const course = await prisma.course.update({
        where: { id: parseInt(id) },
        data: {
            title,
            description,
            is_private: is_private !== undefined ? (is_private === true || is_private === 'true') : undefined,
            is_mandatory: isMandatoryVal,
            mandatory_at,
            apply_scope: apply_scope !== undefined ? apply_scope : undefined,
            mandatory_targets: mandatory_targets !== undefined ? mandatory_targets : undefined,
            mandatory_deadline_days: mandatory_deadline_days !== undefined ? parseInt(mandatory_deadline_days) : undefined,
            mandatory_start_date: mandatory_start_date !== undefined ? (mandatory_start_date ? new Date(mandatory_start_date) : null) : undefined,
            mandatory_end_date: mandatory_end_date !== undefined ? (mandatory_end_date ? new Date(mandatory_end_date) : null) : undefined,
            allow_early_access: allow_early_access !== undefined ? (allow_early_access === true || allow_early_access === 'true') : undefined,
            category_id: category_id ? parseInt(category_id) : undefined,
            level,
            thumbnail,
            intro_video_url,
            learning_outcomes,
            requirements,
            updated_at: new Date()
        }
    });

    // Chỉ gửi thông báo nếu khóa học từ không bắt buộc chuyển sang bắt buộc
    if (isMandatoryVal && !existingCourse.is_mandatory) {
        notificationQueue.add('notify_course', {
            type: 'NOTIFY_MANDATORY_COURSE',
            payload: { courseId: course.id }
        }, { removeOnComplete: true, removeOnFail: false });
    }

    res.json(course);
});

exports.deleteCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.softDeleteCourse(id);
    res.json({ message: 'Đã xóa khóa học và toàn bộ nội dung liên quan' });
});

exports.batchDeleteCourses = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        throw new ApiError(400, 'Danh sách ID không hợp lệ');
    }
    const result = await courseService.batchDeleteCourses(ids);
    res.json({ message: `Đã xóa thành công ${result.successCount} khóa học`, results: result.results });
});

exports.toggleActiveStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    await courseService.toggleActiveStatus(id, active);
    res.json({ message: active ? 'Đã khôi phục khóa học' : 'Đã tạm ẩn khóa học' });
});

exports.restoreCourse = catchAsync(async (req, res) => {
    const { id } = req.params;
    await courseService.restoreCourse(id);
    res.json({ message: 'Đã khôi phục khóa học thành công' });
});

/**
 * Lấy báo cáo Onboarding (Đúng hạn / Trễ hạn)
 */
exports.getMandatoryOverdueReport = catchAsync(async (req, res) => {
    const { type = 'overdue', timeframe = 'all', departmentId: queryDeptId } = req.query; // 'overdue' hoặc 'ontime'
    const { isManagerOnly, departmentId: managerDeptId } = await getManagerDepartmentId(req);
    const finalDepartmentId = isManagerOnly ? managerDeptId : (queryDeptId ? parseInt(queryDeptId) : null);
    const resultList = await courseService.getMandatoryOverdueReport(type, finalDepartmentId, timeframe);
    res.json(resultList);
});



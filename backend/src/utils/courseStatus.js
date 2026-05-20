const { NEW_EMPLOYEE_THRESHOLD_DAYS } = require('../constants/system');

/**
 * Tính toán trạng thái thời hạn và quyền truy cập của một khóa học bắt buộc
 * @param {Object} course Khóa học (cần có is_mandatory, mandatory_start_date, mandatory_end_date, mandatory_deadline_days, allow_early_access)
 * @param {Object} user Người dùng (cần có join_date)
 * @param {number} progressPercent Phần trăm hoàn thành (0 - 100)
 * @param {Date|null} enrolledAt Ngày đăng ký (nếu có)
 * @returns {Object} { status, remainingDays, isOverdue, canAccess, reason, deadlineDate }
 */
exports.calculateCourseStatus = (course, user, progressPercent, enrolledAt = null) => {
    const isCompleted = progressPercent === 100;

    // Nếu không phải khóa học bắt buộc, không tính toán deadline/quá hạn
    if (!course || !course.is_mandatory) {
        return { 
            status: isCompleted ? 'COMPLETED' : 'NORMAL', 
            remainingDays: null, 
            isOverdue: false, 
            canAccess: true, 
            reason: null,
            deadlineDate: null 
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = null;
    let endDate = null;
    let deadlineDate = null;
    let hasDateRange = false;

    // 1. Kiểm tra xem có khoảng ngày cố định không
    if (course.mandatory_start_date && course.mandatory_end_date) {
        startDate = new Date(course.mandatory_start_date);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(course.mandatory_end_date);
        endDate.setHours(23, 59, 59, 999);
        
        deadlineDate = endDate;
        hasDateRange = true;
    } else if (user?.join_date) {
        // 2. Tính toán dựa trên ngày vào làm và thời điểm khóa học bắt buộc
        const joinDate = new Date(user.join_date);
        joinDate.setHours(0, 0, 0, 0);
        
        const mandatoryAt = course.mandatory_at ? new Date(course.mandatory_at) : (course.created_at ? new Date(course.created_at) : new Date());
        mandatoryAt.setHours(0, 0, 0, 0);

        let baseDate;
        if (joinDate < mandatoryAt) {
            // Nhân viên cũ (vào trước khi khóa học bắt buộc) -> Dùng ngày phân công (enrolledAt) hoặc fallback về mandatoryAt
            baseDate = enrolledAt ? new Date(enrolledAt) : mandatoryAt;
        } else {
            // Nhân viên mới (vào sau) -> Dùng ngày vào làm
            baseDate = joinDate;
        }

        baseDate.setHours(0, 0, 0, 0);
        
        deadlineDate = new Date(baseDate);
        deadlineDate.setDate(deadlineDate.getDate() + (course.mandatory_deadline_days || 0));
        deadlineDate.setHours(23, 59, 59, 999);
    }

    let status = 'NORMAL';
    let remainingDays = 0;
    let isOverdue = false;
    let canAccess = true;
    let reason = null;

    // Nếu không có deadline (Nhân viên cũ hoặc không xác định được)
    if (!deadlineDate) {
        return { 
            status: isCompleted ? 'COMPLETED' : 'NORMAL', 
            remainingDays: null, 
            isOverdue: false, 
            canAccess: true, 
            reason: null,
            deadlineDate: null 
        };
    }

    remainingDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (remainingDays < 0) {
        isOverdue = true;
        status = 'OVERDUE';
    }

    if (isCompleted) {
        status = 'COMPLETED';
    } else if (remainingDays >= 0 && remainingDays <= 7) {
        status = 'WARNING'; // Sắp hết hạn
    } else if (remainingDays > 7 && !isOverdue) {
        status = 'NORMAL';
    }

    // Logic kiểm tra Start Date (Early Access)
    if (hasDateRange && startDate) {
        if (today < startDate) {
            status = 'NOT_STARTED';
            if (course.allow_early_access !== true) {
                canAccess = false;
                reason = `Khóa học sẽ mở vào ngày ${startDate.toLocaleDateString('vi-VN')}`;
            }
        }
    }

    return {
        status,
        remainingDays,
        isOverdue,
        canAccess,
        reason,
        deadlineDate
    };
};


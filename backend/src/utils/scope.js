const { NEW_EMPLOYEE_THRESHOLD_DAYS } = require('../constants/system');

/**
 * Kiểm tra xem người dùng có thuộc phạm vi áp dụng của một thực thể (Khóa học/Lộ trình) hay không
 * @param {Object} userData Thông tin người dùng (id, department_id, position_id, join_date)
 * @param {Object} entity Thực thể cần kiểm tra (cần có apply_scope và mandatory_targets)
 * @param {boolean} isEnrolled Trạng thái đã ghi danh (nếu đã ghi danh thì luôn có quyền truy cập)
 * @param {Map} departmentMap Bản đồ ID phòng ban -> parent_id
 * @returns {boolean} true nếu thuộc phạm vi, ngược lại false
 */
const isUserInScope = (userData, entity, isEnrolled = false, departmentMap = null) => {
    if (isEnrolled) return true;
    if (!entity) return true;

    // Nếu thực thể KHÔNG phải riêng tư VÀ KHÔNG phải bắt buộc, nó được hiển thị/truy cập công khai
    if (entity.is_private !== true && entity.is_mandatory !== true) {
        return true;
    }

    const scope = entity.apply_scope || 'ALL_EMPLOYEE';
    
    let targets = [];
    if (entity.mandatory_targets) {
        if (Array.isArray(entity.mandatory_targets)) {
            targets = entity.mandatory_targets;
        } else {
            // Prisma Json type parsing fallback if needed
            try {
                targets = typeof entity.mandatory_targets === 'string' 
                    ? JSON.parse(entity.mandatory_targets) 
                    : entity.mandatory_targets;
            } catch (e) {
                targets = [];
            }
        }
    }
    
    // Đảm bảo targets là mảng các số (hoặc giữ nguyên nếu rỗng) để so sánh khớp kiểu số nguyên từ db
    const normalizedTargets = Array.isArray(targets) ? targets.map(t => Number(t)) : [];

    // 1. Kiểm tra trạng thái Nhân viên mới nếu scope bắt đầu bằng NEW_EMPLOYEE
    const isNewScope = scope.startsWith('NEW_EMPLOYEE');
    if (isNewScope) {
        if (!userData || !userData.join_date) return false;
        const today = new Date();
        const joinDate = new Date(userData.join_date);
        const diffDays = Math.ceil((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > NEW_EMPLOYEE_THRESHOLD_DAYS) return false;
    }

    // 2. Kiểm tra chi tiết từng phạm vi
    if (scope === 'ALL_EMPLOYEE' || scope === 'NEW_EMPLOYEE') return true;
    
    if (scope === 'BY_DEPARTMENT' || scope === 'NEW_EMPLOYEE_BY_DEPARTMENT') {
        if (!userData || !userData.department_id) return false;
        const userDeptId = Number(userData.department_id);

        if (normalizedTargets.includes(userDeptId)) return true;

        if (departmentMap) {
            let currentId = userDeptId;
            for (let i = 0; i < 5; i++) {
                const parentId = departmentMap.get(currentId);
                if (!parentId) break;
                if (normalizedTargets.includes(Number(parentId))) return true;
                currentId = Number(parentId);
            }
        }
        return false;
    }
    
    if (scope === 'BY_POSITION' || scope === 'NEW_EMPLOYEE_BY_POSITION') {
        return !!(userData && userData.position_id && normalizedTargets.includes(Number(userData.position_id)));
    }
    
    if (scope === 'SPECIFIC_USER') {
        return !!(userData && normalizedTargets.includes(Number(userData.id)));
    }
    
    return true;
};

module.exports = {
    isUserInScope
};

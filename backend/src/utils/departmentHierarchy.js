const prisma = require('../configs/prisma');

/**
 * Lấy tất cả ID của phòng ban hiện tại và các phòng ban con cháu trực thuộc (tối đa 3 cấp)
 * @param {number} deptId ID phòng ban cần lấy con cháu
 * @returns {Promise<number[]>} Mảng các ID phòng ban con cháu bao gồm cả ID truyền vào
 */
async function getSubDepartmentIds(deptId) {
    if (!deptId) return [];

    const parsedDeptId = parseInt(deptId);
    if (isNaN(parsedDeptId)) return [];

    // Cấp 2: Lấy các phòng ban con trực tiếp
    const level2 = await prisma.department.findMany({
        where: { parent_id: parsedDeptId },
        select: { id: true }
    });

    const level2Ids = level2.map(d => d.id);
    if (level2Ids.length === 0) {
        return [parsedDeptId];
    }

    // Cấp 3: Lấy các phòng ban con của cấp 2
    const level3 = await prisma.department.findMany({
        where: { parent_id: { in: level2Ids } },
        select: { id: true }
    });

    const level3Ids = level3.map(d => d.id);

    return [parsedDeptId, ...level2Ids, ...level3Ids];
}

/**
 * Lấy danh sách ID của phòng ban cha và ông nội để hỗ trợ kiểm tra Scope ngược lên
 * @param {number} deptId ID phòng ban của người dùng
 * @returns {Promise<number[]>} Mảng các ID từ dưới lên (ví dụ: [chính_nó, cha, ông_nội])
 */
async function getDepartmentAncestors(deptId) {
    if (!deptId) return [];

    const parsedDeptId = parseInt(deptId);
    if (isNaN(parsedDeptId)) return [];

    const ancestors = [parsedDeptId];

    // Lấy cấp cha
    const current = await prisma.department.findUnique({
        where: { id: parsedDeptId },
        select: { parent_id: true }
    });

    if (current && current.parent_id) {
        ancestors.push(current.parent_id);

        // Lấy cấp ông nội
        const parent = await prisma.department.findUnique({
            where: { id: current.parent_id },
            select: { parent_id: true }
        });

        if (parent && parent.parent_id) {
            ancestors.push(parent.parent_id);
        }
    }

    return ancestors;
}

module.exports = {
    getSubDepartmentIds,
    getDepartmentAncestors
};

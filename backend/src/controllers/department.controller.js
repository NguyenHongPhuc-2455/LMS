const prisma = require('../configs/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Lấy danh sách tất cả phòng ban
 */
exports.getDepartments = catchAsync(async (req, res) => {
    const departments = await prisma.department.findMany({
        include: {
            _count: {
                select: { users: true, children: true }
            }
        },
        orderBy: { name: 'asc' }
    });
    res.json(departments);
});

/**
 * Tạo phòng ban mới
 */
exports.createDepartment = catchAsync(async (req, res) => {
    const { name, description, parent_id } = req.body;

    if (!name) throw new ApiError(400, 'Tên phòng ban là bắt buộc');

    const parsedParentId = parent_id ? parseInt(parent_id) : null;

    // 1. Kiểm tra tên phòng ban trùng ở cùng một cấp
    const existing = await prisma.department.findFirst({
        where: { name, parent_id: parsedParentId }
    });
    if (existing) throw new ApiError(400, 'Tên phòng ban đã tồn tại ở cấp này');

    // 2. Kiểm tra giới hạn 3 cấp
    if (parsedParentId) {
        const parentDept = await prisma.department.findUnique({
            where: { id: parsedParentId },
            include: { parent: { include: { parent: true } } }
        });
        if (!parentDept) throw new ApiError(400, 'Phòng ban cấp trên không tồn tại');

        // Nếu phòng ban cha đã là cấp 3 (có cha và ông nội), thì phần tử mới sẽ là cấp 4 -> Báo lỗi
        if (parentDept.parent && parentDept.parent.parent) {
            throw new ApiError(400, 'Cấu trúc phòng ban tối đa chỉ được 3 cấp');
        }
    }

    const department = await prisma.department.create({
        data: {
            name,
            description,
            parent_id: parsedParentId
        }
    });

    res.status(201).json(department);
});

/**
 * Cập nhật phòng ban
 */
exports.updateDepartment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;
    const deptId = parseInt(id);

    if (isNaN(deptId)) {
        throw new ApiError(400, 'ID phòng ban không hợp lệ');
    }

    const parsedParentId = parent_id ? parseInt(parent_id) : null;

    if (deptId === parsedParentId) {
        throw new ApiError(400, 'Phòng ban không thể làm phòng ban cha của chính nó');
    }

    // 1. Kiểm tra tên phòng ban trùng ở cùng một cấp
    const existing = await prisma.department.findFirst({
        where: { name, parent_id: parsedParentId, id: { not: deptId } }
    });
    if (existing) throw new ApiError(400, 'Tên phòng ban đã tồn tại ở cấp này');

    if (parsedParentId) {
        // 2. Kiểm tra giới hạn 3 cấp
        const parentDept = await prisma.department.findUnique({
            where: { id: parsedParentId },
            include: { parent: { include: { parent: true } } }
        });
        if (!parentDept) throw new ApiError(400, 'Phòng ban cấp trên không tồn tại');

        if (parentDept.parent && parentDept.parent.parent) {
            throw new ApiError(400, 'Cấu trúc phòng ban tối đa chỉ được 3 cấp');
        }

        // 3. Kiểm tra chống vòng lặp (Parent không được là con cháu của chính nó)
        const { getSubDepartmentIds } = require('../utils/departmentHierarchy');
        const childIds = await getSubDepartmentIds(deptId);
        if (childIds.includes(parsedParentId)) {
            throw new ApiError(400, 'Phòng ban cha không thể là phòng ban con/cháu trực thuộc của phòng ban này');
        }
    }

    const department = await prisma.department.update({
        where: { id: deptId },
        data: { name, description, parent_id: parsedParentId }
    });

    res.json(department);
});

/**
 * Xóa phòng ban
 */
exports.deleteDepartment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const deptId = parseInt(id);

    if (isNaN(deptId)) {
        throw new ApiError(400, 'ID phòng ban không hợp lệ');
    }

    // 1. Kiểm tra xem có phòng ban con nào trực thuộc không
    const childrenCount = await prisma.department.count({
        where: { parent_id: deptId }
    });
    if (childrenCount > 0) {
        throw new ApiError(400, 'Không thể xóa phòng ban đang có các phòng ban con trực thuộc');
    }

    // 2. Kiểm tra xem có người dùng nào thuộc phòng ban này không
    const userCount = await prisma.user.count({
        where: { department_id: deptId }
    });

    if (userCount > 0) {
        throw new ApiError(400, 'Không thể xóa phòng ban đang có nhân viên');
    }

    await prisma.department.delete({
        where: { id: deptId }
    });

    res.json({ message: 'Xóa phòng ban thành công' });
});

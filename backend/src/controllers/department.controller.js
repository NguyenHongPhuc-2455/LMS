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
                select: { users: true }
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
    const { name, description } = req.body;

    if (!name) throw new ApiError(400, 'Tên phòng ban là bắt buộc');

    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) throw new ApiError(400, 'Tên phòng ban đã tồn tại');

    const department = await prisma.department.create({
        data: { name, description }
    });

    res.status(201).json(department);
});

/**
 * Cập nhật phòng ban
 */
exports.updateDepartment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.department.findFirst({
        where: { name, id: { not: parseInt(id) } }
    });
    if (existing) throw new ApiError(400, 'Tên phòng ban đã tồn tại');

    const department = await prisma.department.update({
        where: { id: parseInt(id) },
        data: { name, description }
    });

    res.json(department);
});

/**
 * Xóa phòng ban
 */
exports.deleteDepartment = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Kiểm tra xem có người dùng nào thuộc phòng ban này không
    const userCount = await prisma.user.count({
        where: { department_id: parseInt(id) }
    });

    if (userCount > 0) {
        throw new ApiError(400, 'Không thể xóa phòng ban đang có nhân viên');
    }

    await prisma.department.delete({
        where: { id: parseInt(id) }
    });

    res.json({ message: 'Xóa phòng ban thành công' });
});

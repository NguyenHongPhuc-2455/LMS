const prisma = require('../configs/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Lấy danh sách tất cả vị trí
 */
exports.getPositions = catchAsync(async (req, res) => {
    const positions = await prisma.position.findMany({
        include: {
            _count: {
                select: { users: true }
            }
        },
        orderBy: { name: 'asc' }
    });
    res.json(positions);
});

/**
 * Tạo vị trí mới
 */
exports.createPosition = catchAsync(async (req, res) => {
    const { name, description } = req.body;

    if (!name) throw new ApiError(400, 'Tên vị trí là bắt buộc');

    const existing = await prisma.position.findUnique({ where: { name } });
    if (existing) throw new ApiError(400, 'Tên vị trí đã tồn tại');

    const position = await prisma.position.create({
        data: { name, description }
    });

    res.status(201).json(position);
});

/**
 * Cập nhật vị trí
 */
exports.updatePosition = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.position.findFirst({
        where: { name, id: { not: parseInt(id) } }
    });
    if (existing) throw new ApiError(400, 'Tên vị trí đã tồn tại');

    const position = await prisma.position.update({
        where: { id: parseInt(id) },
        data: { name, description }
    });

    res.json(position);
});

/**
 * Xóa vị trí
 */
exports.deletePosition = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Kiểm tra xem có người dùng nào thuộc vị trí này không
    const userCount = await prisma.user.count({
        where: { position_id: parseInt(id) }
    });

    if (userCount > 0) {
        throw new ApiError(400, 'Không thể xóa vị trí đang có nhân viên');
    }

    await prisma.position.delete({
        where: { id: parseInt(id) }
    });

    res.json({ message: 'Xóa vị trí thành công' });
});

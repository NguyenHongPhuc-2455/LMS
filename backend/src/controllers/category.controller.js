const prisma = require('../configs/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Lấy danh sách tất cả danh mục
 */
exports.getCategories = catchAsync(async (req, res) => {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { 
                    courses: {
                        where: { deleted_at: null }
                    } 
                }
            }
        }
    });
    res.json(categories);
});

/**
 * Tạo danh mục mới
 */
exports.createCategory = catchAsync(async (req, res) => {
    const { name, description } = req.body;
    if (!name) throw new ApiError(400, 'Tên danh mục là bắt buộc');

    // Kiểm tra trùng tên
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) throw new ApiError(400, 'Tên danh mục đã tồn tại');

    const category = await prisma.category.create({
        data: { name, description }
    });
    res.status(201).json(category);
});

/**
 * Cập nhật danh mục
 */
exports.updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Kiểm tra tồn tại
    const target = await prisma.category.findUnique({ where: { id: parseInt(id) } });
    if (!target) throw new ApiError(404, 'Không tìm thấy danh mục');

    // Kiểm tra trùng tên nếu đổi tên
    if (name && name !== target.name) {
        const existing = await prisma.category.findUnique({ where: { name } });
        if (existing) throw new ApiError(400, 'Tên danh mục mới đã tồn tại');
    }

    const category = await prisma.category.update({
        where: { id: parseInt(id) },
        data: { name, description }
    });
    res.json(category);
});

/**
 * Xóa danh mục
 */
exports.deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Kiểm tra xem có khóa học nào đang thuộc danh mục này không
    const courseCount = await prisma.course.count({
        where: { category_id: parseInt(id) }
    });

    if (courseCount > 0) {
        throw new ApiError(400, 'Không thể xóa danh mục đang có khóa học. Vui lòng chuyển các khóa học sang danh mục khác trước.');
    }

    await prisma.category.delete({
        where: { id: parseInt(id) }
    });

    res.json({ message: 'Đã xóa danh mục thành công' });
});

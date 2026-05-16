const prisma = require('../configs/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Lấy danh sách tất cả vai trò
 */
const getRoles = async () => {
    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: { user_roles: true }
            }
        },
        orderBy: { id: 'asc' }
    });

    // Map lại kết quả để frontend dễ dùng (đổi user_roles thành users)
    return roles.map(r => ({
        ...r,
        _count: {
            users: r._count.user_roles
        }
    }));
};

/**
 * Tạo vai trò mới
 */
const createRole = async (roleData) => {
    const { name, description } = roleData;
    
    // Kiểm tra tên vai trò đã tồn tại chưa
    const existingRole = await prisma.role.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
    });
    
    if (existingRole) {
        throw new ApiError(400, 'Tên vai trò này đã tồn tại');
    }

    return await prisma.role.create({
        data: { name, description }
    });
};

/**
 * Cập nhật vai trò
 */
const updateRole = async (id, roleData) => {
    const { name, description } = roleData;
    
    const role = await prisma.role.findUnique({ where: { id: parseInt(id) } });
    if (!role) throw new ApiError(404, 'Không tìm thấy vai trò');

    // Nếu đổi tên, kiểm tra trùng lặp
    if (name && name.toLowerCase() !== role.name.toLowerCase()) {
        const existingRole = await prisma.role.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });
        if (existingRole) throw new ApiError(400, 'Tên vai trò mới đã tồn tại');
    }

    return await prisma.role.update({
        where: { id: parseInt(id) },
        data: { name, description }
    });
};

/**
 * Xóa vai trò
 */
const deleteRole = async (id) => {
    const roleId = parseInt(id);
    
    // Không cho phép xóa các role hệ thống quan trọng (tùy chọn)
    const role = await prisma.role.findUnique({ 
        where: { id: roleId },
        include: { _count: { select: { user_roles: true } } }
    });
    
    if (!role) throw new ApiError(404, 'Không tìm thấy vai trò');
    
    if (role._count.user_roles > 0) {
        throw new ApiError(400, 'Không thể xóa vai trò đang có người dùng sử dụng');
    }

    // Tránh xóa nhầm Admin role gốc (thường ID là 1 hoặc tên là ADMIN)
    if (role.name.toUpperCase() === 'ADMIN') {
        throw new ApiError(400, 'Không được phép xóa vai trò Quản trị viên hệ thống');
    }

    return await prisma.role.delete({
        where: { id: roleId }
    });
};

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole
};

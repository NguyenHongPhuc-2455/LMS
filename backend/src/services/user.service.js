const prisma = require('../configs/prisma');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

/**
 * Lấy danh sách người dùng với phân trang và tìm kiếm
 */
const getUsers = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const search = query.search || '';
    const skip = (page - 1) * limit;

    const where = {
        ...(query.include_inactive !== 'true' && { deleted_at: null }),
        ...(query.department_id && { department_id: parseInt(query.department_id) }),
        ...(query.position_id && { position_id: parseInt(query.position_id) }),
        OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { full_name: { contains: search, mode: 'insensitive' } },
            { employee_id: { contains: search, mode: 'insensitive' } },
            { department: { name: { contains: search, mode: 'insensitive' } } }
        ]
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: {
                department: true,
                position: true,
                user_roles: { include: { role: true } },
                enrollments: {
                    where: {
                        course: {
                            deleted_at: null
                        }
                    },
                    include: {
                        course: { select: { title: true } }
                    }
                },
                _count: {
                    select: {
                        enrollments: {
                            where: {
                                course: {
                                    deleted_at: null
                                }
                            }
                        }
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { id: 'desc' }
        }),
        prisma.user.count({ where })
    ]);

    const safeUsers = users.map(u => {
        const { password_hash, user_roles, enrollments, department, position, ...data } = u;
        return {
            ...data,
            department_id: u.department_id,
            position_id: u.position_id,
            department: department?.name || '',
            position: position?.name || '',
            roles: user_roles.map(ur => ur.role),
            enrollments_count: u._count.enrollments,
            enrolled_courses: enrollments.map(e => ({ id: e.course_id, title: e.course.title }))
        };
    });

    return {
        users: safeUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

const parseDate = (date) => (date === null || date === '') ? null : (date ? new Date(date) : undefined);

/**
 * Cập nhật thông tin người dùng (Admin)
 */
const updateUser = async (id, updateData) => {
    const {
        id: _,
        updated_at,
        role_id,
        employee_id,
        join_date,
        roles,
        user_roles,
        enrollments_count,
        enrolled_courses,
        _count,
        department,
        position,
        department_id,
        position_id,
        ...data
    } = updateData;

    // Kiểm tra employee_id duy nhất nếu có thay đổi
    if (employee_id) {
        const existingUser = await prisma.user.findFirst({
            where: {
                employee_id,
                id: { not: parseInt(id) },
                deleted_at: null
            }
        });
        if (existingUser) {
            throw new ApiError(400, 'Mã nhân sự đã tồn tại trong hệ thống');
        }
    }

    return await prisma.$transaction(async (tx) => {
        // Prepare update data
        const finalData = {
            ...data,
            employee_id: employee_id || undefined,
            department_id: (department_id !== undefined && department_id !== null) ? parseInt(String(department_id), 10) : null,
            position_id: (position_id !== undefined && position_id !== null) ? parseInt(String(position_id), 10) : null,
            join_date: parseDate(join_date),
            dob: parseDate(updateData.dob)
        };

        const user = await tx.user.update({
            where: { id: parseInt(id) },
            data: finalData
        });

        if (role_id) {
            await tx.userRole.deleteMany({ where: { user_id: parseInt(id) } });
            await tx.userRole.create({
                data: {
                    user_id: parseInt(id),
                    role_id: parseInt(role_id)
                }
            });
        }

        return user;
    });
};

/**
 * Lấy thông tin cá nhân (Profile)
 */
const getProfile = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            department: true,
            position: true,
            user_roles: { include: { role: true } }
        }
    });

    if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

    const { password_hash, user_roles, department, position, ...safeUser } = user;
    return {
        ...safeUser,
        department: department?.name || '',
        position: position?.name || '',
        roles: user_roles.map(ur => ur.role.name)
    };
};

/**
 * Cập nhật thông tin cá nhân
 */
const updateProfile = async (id, updateData) => {
    const {
        id: _,
        updated_at,
        role_id,
        employee_id: empId,
        roles,
        user_roles,
        enrollments_count,
        enrolled_courses,
        _count,
        department,
        position,
        department_id,
        position_id,
        dob,
        ...data
    } = updateData;

    // Kiểm tra employee_id duy nhất
    if (empId) {
        const existingUser = await prisma.user.findFirst({
            where: {
                employee_id: empId,
                id: { not: id },
                deleted_at: null
            }
        });
        if (existingUser) {
            throw new ApiError(400, 'Mã nhân sự đã tồn tại');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            ...data,
            employee_id: empId,
            department_id: updateData.department_id ? parseInt(updateData.department_id) : null,
            position_id: updateData.position_id ? parseInt(updateData.position_id) : null,
            dob: parseDate(dob),
            join_date: parseDate(updateData.join_date)
        },
        include: {
            department: true,
            position: true,
            user_roles: { include: { role: true } }
        }
    });

    const { password_hash, user_roles: ur, department: d, position: p, ...safeUser } = updatedUser;
    return {
        ...safeUser,
        department: d?.name || '',
        position: p?.name || '',
        roles: ur.map(item => item.role.name)
    };
};

/**
 * Tạo người dùng mới (Admin)
 */
const createUser = async (userData) => {
    const { username, email, password, role_id, employee_id, join_date, department_id, position_id, ...rest } = userData;

    if (employee_id) {
        const existingUser = await prisma.user.findUnique({ where: { employee_id } });
        if (existingUser) throw new ApiError(400, 'Mã nhân sự đã tồn tại');
    }

    const hashed = hashPassword(password);
    return await prisma.user.create({
        data: {
            ...rest,
            username,
            email,
            employee_id,
            department_id: (department_id !== undefined && department_id !== null) ? parseInt(String(department_id), 10) : null,
            position_id: (position_id !== undefined && position_id !== null) ? parseInt(String(position_id), 10) : null,
            join_date: parseDate(join_date),
            password_hash: hashed,
            user_roles: {
                create: { role_id: role_id ? parseInt(String(role_id), 10) : 3 }
            }
        }
    });
};

const deleteUser = async (id, currentUserId) => {
    const userId = parseInt(id);
    if (userId === currentUserId) {
        throw new ApiError(400, 'Bạn không thể tự xóa chính mình');
    }
    
    return await prisma.user.delete({
        where: { id: userId }
    });
};

const deleteBatchUsers = async (ids, currentUserId) => {
    const validIds = ids
        .map(id => parseInt(id))
        .filter(id => id !== currentUserId);

    if (validIds.length === 0) {
        throw new ApiError(400, 'Không có người dùng hợp lệ để xóa hoặc bạn đang cố gắng tự xóa chính mình');
    }

    return await prisma.user.deleteMany({
        where: { id: { in: validIds } }
    });
};

const revokeCourseAccess = async (userId, courseId) => {
    return await prisma.$transaction(async (tx) => {
        await tx.enrollment.deleteMany({
            where: {
                user_id: parseInt(userId),
                course_id: parseInt(courseId)
            }
        });

        await tx.courseRequest.updateMany({
            where: {
                user_id: parseInt(userId),
                course_id: parseInt(courseId),
                status: 'APPROVED'
            },
            data: { status: 'REJECTED' }
        });
    });
};

const restoreUser = async (id) => {
    return await prisma.user.update({
        where: { id: parseInt(id) },
        data: { deleted_at: null }
    });
};

/**
 * Bật/Tắt trạng thái hoạt động của người dùng
 */
const toggleUserStatus = async (id, currentIsActive) => {
    return await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
            deleted_at: currentIsActive ? new Date() : null
        }
    });
};

const getRoles = async () => {
    return await prisma.role.findMany();
};

module.exports = {
    getUsers,
    updateUser,
    getProfile,
    updateProfile,
    createUser,
    deleteUser,
    deleteBatchUsers,
    restoreUser,
    toggleUserStatus,
    revokeCourseAccess,
    getRoles
};


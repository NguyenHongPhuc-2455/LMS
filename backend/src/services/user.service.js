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
        deleted_at: null,
        ...(query.department_id && { department_id: parseInt(query.department_id) }),
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
        const { password_hash, user_roles, enrollments, department, ...data } = u;
        return {
            ...data,
            department: department?.name || '',
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
        const user = await tx.user.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                employee_id,
                department_id: data.department_id ? parseInt(data.department_id) : undefined,
                join_date: parseDate(join_date),
                dob: parseDate(data.dob),
            }
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
            user_roles: { include: { role: true } }
        }
    });

    if (!user) throw new ApiError(404, 'Người dùng không tồn tại');

    const { password_hash, user_roles, department, ...safeUser } = user;
    return {
        ...safeUser,
        department: department?.name || '',
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
            department_id: data.department_id ? parseInt(data.department_id) : undefined,
            dob: parseDate(dob),
            join_date: parseDate(data.join_date)
        },
        include: {
            department: true,
            user_roles: { include: { role: true } }
        }
    });

    const { password_hash, user_roles: ur, department: d, ...safeUser } = updatedUser;
    return {
        ...safeUser,
        department: d?.name || '',
        roles: ur.map(item => item.role.name)
    };
};

/**
 * Tạo người dùng mới (Admin)
 */
const createUser = async (userData) => {
    const { username, email, password, role_id, employee_id, join_date, ...rest } = userData;

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
            department_id: rest.department_id ? parseInt(rest.department_id) : undefined,
            join_date: parseDate(join_date),
            password_hash: hashed,
            user_roles: {
                create: { role_id: parseInt(role_id) || 3 }
            }
        }
    });
};

const deleteUser = async (id, currentUserId) => {
    if (parseInt(id) === currentUserId) {
        throw new ApiError(400, 'Bạn không thể tự xóa chính mình');
    }
    return await prisma.user.update({
        where: { id: parseInt(id) },
        data: { deleted_at: new Date() }
    });
};

const deleteBatchUsers = async (ids, currentUserId) => {
    const validIds = ids
        .map(id => parseInt(id))
        .filter(id => id !== currentUserId);

    if (validIds.length === 0) {
        throw new ApiError(400, 'Không có người dùng hợp lệ để xóa hoặc bạn đang cố gắng tự xóa chính mình');
    }

    return await prisma.user.updateMany({
        where: { id: { in: validIds } },
        data: { deleted_at: new Date() }
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
    revokeCourseAccess,
    getRoles
};


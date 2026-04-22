const prisma = require('../configs/prisma');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const where = {
            deleted_at: null,
            OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { full_name: { contains: search, mode: 'insensitive' } }
            ]
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    user_roles: { include: { role: true } },
                    enrollments: {
                        include: {
                            course: { select: { title: true } }
                        }
                    },
                    _count: { select: { enrollments: true } }
                },
                skip,
                take: limit,
                orderBy: { id: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        // Flatten roles for easier frontend consumption
        const safeUsers = users.map(u => {
            const { password_hash, user_roles, enrollments, ...data } = u;
            return {
                ...data,
                roles: user_roles.map(ur => ur.role),
                enrollments_count: u._count.enrollments,
                enrolled_courses: enrollments.map(e => ({ id: e.course_id, title: e.course.title }))
            };
        });

        res.json({
            users: safeUsers,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.revokeCourseAccess = async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) {
            return res.status(400).json({ error: 'Thiếu thông tin người dùng hoặc khóa học' });
        }

        // 1. Xóa Enrollment
        await prisma.enrollment.deleteMany({
            where: {
                user_id: parseInt(userId),
                course_id: parseInt(courseId)
            }
        });

        // 2. Cập nhật Request tương ứng (nếu có)
        await prisma.courseRequest.updateMany({
            where: {
                user_id: parseInt(userId),
                course_id: parseInt(courseId),
                status: 'APPROVED'
            },
            data: { status: 'REJECTED' }
        });

        res.json({ message: 'Đã thu hồi quyền truy cập khóa học thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRoles = async (req, res) => {
    try {
        const roles = await prisma.role.findMany();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, role_id, phone, dob, gender, bio, avatar } = req.body;

        // Cập nhật thông tin cơ bản
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                username,
                email,
                full_name,
                phone,
                dob: dob ? new Date(dob) : null,
                gender,
                bio,
                avatar
            }
        });

        // Nếu có thay đổi role
        if (role_id) {
            await prisma.userRole.deleteMany({ where: { user_id: parseInt(id) } });
            await prisma.userRole.create({
                data: {
                    user_id: parseInt(id),
                    role_id: parseInt(role_id)
                }
            });
        }

        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const id = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                user_roles: { include: { role: true } }
            }
        });

        const { password_hash, user_roles, ...safeUser } = user;
        const finalUser = {
            ...safeUser,
            roles: user_roles.map(ur => ur.role.name)
        };

        res.json(finalUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const id = req.user.id; // Lấy ID từ token đã verify
        const { full_name, avatar, phone, dob, gender, bio, email } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { full_name, avatar, phone, dob, gender, bio, email },
            include: {
                user_roles: { include: { role: true } }
            }
        });

        const { password_hash, user_roles, ...safeUser } = updatedUser;
        const finalUser = {
            ...safeUser,
            roles: user_roles.map(ur => ur.role.name)
        };

        res.json({ message: 'Cập nhật hồ sơ thành công', user: finalUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role_id } = req.body;

        const hashed = hashPassword(password);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password_hash: hashed,
                user_roles: {
                    create: { role_id: parseInt(role_id) || 3 } // Mặc định là student (id 3 trong seed mới)
                }
            }
        });

        res.json({ message: 'Tạo người dùng mới thành công', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Bạn không thể tự xóa chính mình' });
        }
        // Soft delete
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { deleted_at: new Date() }
        });
        res.json({ message: 'Đã xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.batchUpdateUsers = async (req, res) => {
    try {
        const { users } = req.body; // Expecting [{id, username, email, ...}]

        if (!Array.isArray(users)) {
            return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
        }

        const updates = users.map(async (u) => {
            const { id, username, email, full_name, role_id, phone, dob, gender, bio, avatar } = u;

            // Cập nhật thông tin cơ bản
            await prisma.user.update({
                where: { id: parseInt(id) },
                data: {
                    username,
                    email,
                    full_name,
                    phone,
                    dob: dob ? new Date(dob) : undefined,
                    gender,
                    bio,
                    avatar
                }
            });

            // Nếu có thay đổi role
            if (role_id) {
                await prisma.userRole.deleteMany({ where: { user_id: parseInt(id) } });
                await prisma.userRole.create({
                    data: {
                        user_id: parseInt(id),
                        role_id: parseInt(role_id)
                    }
                });
            }
        });

        await Promise.all(updates);

        res.json({ message: `Đã cập nhật thành công ${users.length} thành viên` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


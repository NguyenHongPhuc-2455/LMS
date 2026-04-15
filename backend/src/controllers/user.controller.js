const prisma = require('../configs/prisma');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

exports.getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { deleted_at: null },
            include: {
                user_roles: { include: { role: true } },
                enrollments: {
                    include: {
                        course: { select: { title: true } }
                    }
                },
                _count: { select: { enrollments: true } }
            },
            orderBy: { id: 'desc' }
        });

        // Flatten roles for easier frontend consumption
        const safeUsers = users.map(u => {
            const { password_hash, user_roles, enrollments, ...data } = u;
            return {
                ...data,
                roles: user_roles.map(ur => ur.role),
                enrollments_count: u._count.enrollments,
                enrolled_courses: enrollments.map(e => e.course.title)
            };
        });

        res.json(safeUsers);
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

const prisma = require('../configs/prisma');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

exports.getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { deleted_at: null },
            include: {
                user_roles: { include: { role: true } },
                _count: { select: { enrollments: true } }
            },
            orderBy: { id: 'desc' }
        });

        // Flatten roles for easier frontend consumption
        const safeUsers = users.map(u => {
            const { password_hash, user_roles, ...data } = u;
            return {
                ...data,
                roles: user_roles.map(ur => ur.role),
                enrollments_count: u._count.enrollments
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
        const { username, email, full_name, role_id } = req.body;

        // Cập nhật thông tin cơ bản
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { username, email, full_name }
        });

        // Nếu có thay đổi role (ở đây ta giả định 1 user có 1 chính, nếu m-n thực thụ thì cần logic khác)
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

const prisma = require('../configs/prisma');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation cơ bản
        if (!username || !email || !password) return res.status(400).json({ error: 'Vui lòng nhập đủ thông tin' });

        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email không hợp lệ' });

        // Validate Username
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) return res.status(400).json({ error: 'Username phải từ 3-20 ký tự và không có ký tự đặc biệt' });

        // Validate Password
        if (password.length < 6) return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] }
        });
        if (existingUser) return res.status(400).json({ error: 'Username hoặc Email đã tồn tại' });

        // Khởi tạo role student nếu chưa có
        let studentRole = await prisma.role.findUnique({ where: { name: 'student' } });
        if (!studentRole) {
            studentRole = await prisma.role.create({ data: { name: 'student', description: 'Học viên' } });
        }

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password_hash: hashPassword(password),
                user_roles: {
                    create: { role_id: studentRole.id }
                }
            }
        });
        res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { username },
            include: { user_roles: { include: { role: true } } }
        });

        if (!user || user.password_hash !== hashPassword(password)) {
            return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        }

        const roleNames = user.user_roles.map(ur => ur.role.name);

        const defaultSecret = 'super_secret_key_123';
        const token = jwt.sign(
            { id: user.id, username: user.username, roles: roleNames },
            process.env.JWT_SECRET || defaultSecret,
            { expiresIn: '1d' }
        );
        res.json({ message: 'Đăng nhập thành công', token, user: { id: user.id, username: user.username, roles: roleNames } });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
};

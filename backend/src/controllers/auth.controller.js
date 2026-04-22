const prisma = require('../configs/prisma');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

exports.register = async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

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
                full_name,
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

const generateTokens = (payload) => {
    const defaultSecret = 'super_secret_key_123';
    const secret = process.env.JWT_SECRET || defaultSecret;

    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
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
        const payload = { id: user.id, username: user.username, roles: roleNames };

        const { accessToken, refreshToken } = generateTokens(payload);

        res.json({
            message: 'Đăng nhập thành công',
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, roles: roleNames }
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh Token là bắt buộc' });
        }

        const defaultSecret = 'super_secret_key_123';
        const secret = process.env.JWT_SECRET || defaultSecret;

        // Verify Refresh Token
        let payload;
        try {
            payload = jwt.verify(refreshToken, secret);
        } catch (err) {
            return res.status(403).json({ error: 'Refresh Token không hợp lệ hoặc đã hết hạn' });
        }

        // Tạo Access Token mới (Xóa các field iat và exp cũ của payload)
        const newPayload = { id: payload.id, username: payload.username, roles: payload.roles };
        const accessToken = jwt.sign(newPayload, secret, { expiresIn: '15m' });

        res.json({ accessToken });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server: ' + error.message });
    }
};

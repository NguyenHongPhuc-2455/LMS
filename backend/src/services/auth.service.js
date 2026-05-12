const prisma = require('../configs/prisma');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const generateTokens = (payload) => {
    const secret = process.env.JWT_SECRET || 'super_secret_key_123';
    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

exports.register = async (data) => {
    const { username, email, password, full_name } = data;

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] }
    });
    if (existingUser) throw new ApiError(400, 'Username hoặc Email đã tồn tại');

    // Khởi tạo role student nếu chưa có
    let studentRole = await prisma.role.findUnique({ where: { name: 'student' } });
    if (!studentRole) {
        studentRole = await prisma.role.create({ data: { name: 'student', description: 'Học viên' } });
    }

    return await prisma.user.create({
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
};

exports.login = async (username, password) => {
    const user = await prisma.user.findUnique({
        where: { username },
        include: { user_roles: { include: { role: true } } }
    });

    if (!user || user.password_hash !== hashPassword(password)) {
        throw new ApiError(401, 'Sai tài khoản hoặc mật khẩu');
    }

    // ✅ Tự động set join_date = hôm nay nếu chưa có (lần đăng nhập đầu tiên)
    let isFirstLogin = false;
    if (!user.join_date) {
        await prisma.user.update({
            where: { id: user.id },
            data: { join_date: new Date() }
        });
        isFirstLogin = true;
    }

    const roleNames = user.user_roles.map(ur => ur.role.name);
    const payload = { id: user.id, username: user.username, roles: roleNames };
    const tokens = generateTokens(payload);

    // ✅ Lấy danh sách khóa học bắt buộc để thông báo (nếu lần đầu login hoặc còn khóa chưa xong)
    let mandatoryCourses = [];
    try {
        const today = new Date();
        const joinDate = user.join_date || new Date();

        mandatoryCourses = await prisma.course.findMany({
            where: { is_mandatory: true, deleted_at: null },
            select: { id: true, title: true, thumbnail: true, mandatory_deadline_days: true }
        });

        mandatoryCourses = mandatoryCourses.map(course => {
            const deadlineDate = new Date(joinDate);
            deadlineDate.setDate(deadlineDate.getDate() + course.mandatory_deadline_days);
            const remainingDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
            return { ...course, remainingDays };
        });
    } catch (e) {
        mandatoryCourses = [];
    }

    return {
        ...tokens,
        user: { id: user.id, username: user.username, roles: roleNames },
        isFirstLogin,
        mandatoryCourses
    };
};

exports.refresh = async (refreshToken) => {
    if (!refreshToken) throw new ApiError(401, 'Refresh Token là bắt buộc');

    const secret = process.env.JWT_SECRET || 'super_secret_key_123';
    
    try {
        const payload = jwt.verify(refreshToken, secret);
        const newPayload = { id: payload.id, username: payload.username, roles: payload.roles };
        const accessToken = jwt.sign(newPayload, secret, { expiresIn: '15m' });
        return { accessToken };
    } catch (err) {
        throw new ApiError(403, 'Refresh Token không hợp lệ hoặc đã hết hạn');
    }
};

const prisma = require('../configs/prisma');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const config = require('../configs/env.config');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const generateTokens = (payload) => {
    if (!config.jwt.secret) throw new ApiError(500, 'Hệ thống chưa được cấu hình JWT_SECRET');
    const secret = config.jwt.secret;
    const accessToken = jwt.sign(payload, secret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: config.jwt.refreshExpiresIn });
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
        include: {
            user_roles: { include: { role: true } },
            department: true,
            position: true
        }
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

    // ✅ Lấy danh sách khóa học bắt buộc để thông báo (Sử dụng service chung để đảm bảo logic thống nhất)
    let mandatoryCourses = [];
    try {
        const enrollmentService = require('./enrollment.service');
        mandatoryCourses = await enrollmentService.getMandatoryCoursesForUser(user.id);
        
        // Chỉ lấy các thông tin cần thiết cho FE thông báo
        mandatoryCourses = mandatoryCourses.map(course => ({
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            remainingDays: course.remainingDays,
            status: course.status
        }));
    } catch (e) {
        console.error("Lỗi lấy khóa học bắt buộc khi login:", e);
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

    if (!config.jwt.secret) throw new ApiError(500, 'Hệ thống chưa được cấu hình JWT_SECRET');
    const secret = config.jwt.secret;

    try {
        const payload = jwt.verify(refreshToken, secret);
        const newPayload = { id: payload.id, username: payload.username, roles: payload.roles };
        const accessToken = jwt.sign(newPayload, secret, { expiresIn: config.jwt.expiresIn });
        return { accessToken };
    } catch (err) {
        throw new ApiError(403, 'Refresh Token không hợp lệ hoặc đã hết hạn');
    }
};

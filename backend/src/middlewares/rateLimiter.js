const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
        // Tăng giới hạn nếu đã đăng nhập (Authorization header) để tránh block nhầm khi xem video/load tài nguyên
        if (req.headers.authorization) return 5000;
        return 1000;
    },
    keyGenerator: (req) => {
        // Phân biệt theo UserId nếu có, nếu không thì dùng IP
        return req.user?.id ? req.user.id.toString() : req.ip;
    },
    message: {
        status: 429,
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút'
    },
    validate: { ip: false },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Tăng lên 100 để test login/register thoải mái hơn
    message: {
        status: 429,
        message: 'Bạn đã thử đăng nhập quá nhiều lần, vui lòng quay lại sau 1 giờ'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    authLimiter
};

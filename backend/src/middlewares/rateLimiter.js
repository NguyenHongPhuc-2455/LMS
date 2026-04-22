const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Tăng lên 1000 trong môi trường dev để tránh bị block khi reload
    message: {
        status: 429,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
    },
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

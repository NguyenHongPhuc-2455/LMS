const jwt = require('jsonwebtoken');

const generateStreamToken = (userId, lessonId, clientIp) => {
    // Token có thời hạn sử dụng 2h (đủ cho 1 buổi học)
    // Gắn clientIp để chống chia sẻ link giữa các máy khác nhau
    const payload = {
        userId: userId || 'guest',
        lessonId: lessonId,
        clientIp: clientIp
    };
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secretKey', { expiresIn: '2h' });
};

const verifyStreamToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secretKey');
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateStreamToken,
    verifyStreamToken
};

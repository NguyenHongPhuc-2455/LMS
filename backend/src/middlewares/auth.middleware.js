const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });

    try {
        const defaultSecret = 'super_secret_key_123';
        const decoded = jwt.verify(token, process.env.JWT_SECRET || defaultSecret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã bị chỉnh sửa.' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.roles && req.user.roles.includes('admin')) {
        next();
    } else {
        res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện hành động này' });
    }
};

exports.isInstructor = (req, res, next) => {
    if (req.user && req.user.roles && (req.user.roles.includes('instructor') || req.user.roles.includes('admin'))) {
        next();
    } else {
        res.status(403).json({ error: 'Chỉ Instructor hoặc Admin mới có quyền thực hiện hành động này' });
    }
};

/**
 * Middleware cho phép nhiều vai trò truy cập
 * @param {string[]} roles Danh sách các vai trò được phép
 */
exports.authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
        }

        const hasRole = roles.some(role => req.user.roles.includes(role));
        if (hasRole) {
            next();
        } else {
            res.status(403).json({ error: `Hành động này yêu cầu một trong các vai trò: ${roles.join(', ')}` });
        }
    };
};

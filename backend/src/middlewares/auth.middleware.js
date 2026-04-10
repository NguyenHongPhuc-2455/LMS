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
    // Với schema mới, roles nằm trong mảng user_roles
    if (req.user && req.user.roles && req.user.roles.includes('admin')) {
        next();
    } else {
        res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện hành động này' });
    }
};

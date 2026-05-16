const jwt = require('jsonwebtoken');
const config = require('../configs/env.config');
const MESSAGES = require('../constants/messages');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('[DEBUG] Auth Header received:', authHeader ? 'Present' : 'Missing');
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ error: MESSAGES.AUTH.UNAUTHORIZED });

    try {
        if (!config.jwt.secret) {
            console.error('[CRITICAL ERROR] JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ error: MESSAGES.SYSTEM.MISSING_CONFIG });
        }
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: MESSAGES.AUTH.INVALID_TOKEN });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.roles && req.user.roles.some(r => r.toLowerCase() === 'admin')) {
        next();
    } else {
        res.status(403).json({ error: MESSAGES.AUTH.ADMIN_REQUIRED });
    }
};

exports.isAdminOrManager = (req, res, next) => {
    if (!req.user || !req.user.roles) return res.status(403).json({ error: MESSAGES.AUTH.FORBIDDEN });
    
    const roles = req.user.roles.map(r => r.toLowerCase());
    const isAuthorized = roles.includes('admin') || roles.includes('manager');

    if (isAuthorized) {
        next();
    } else {
        res.status(403).json({ error: MESSAGES.AUTH.ADMIN_MANAGER_REQUIRED });
    }
};

exports.isAdminOrStaffRead = (req, res, next) => {
    if (!req.user || !req.user.roles) return res.status(403).json({ error: MESSAGES.AUTH.FORBIDDEN });
    
    const roles = req.user.roles.map(r => r.toLowerCase());
    const isAdminOrManager = roles.includes('admin') || roles.includes('manager');
    const isStaff = roles.includes('instructor') || roles.includes('lecturer');

    // Admin/Manager có toàn quyền (bao gồm cả GET)
    if (isAdminOrManager) return next();

    // Giảng viên chỉ có quyền Xem (GET)
    if (isStaff && req.method === 'GET') return next();

    res.status(403).json({ error: MESSAGES.AUTH.FORBIDDEN });
};

exports.isInstructor = (req, res, next) => {
    if (!req.user || !req.user.roles) return res.status(403).json({ error: MESSAGES.AUTH.FORBIDDEN });
    const roles = req.user.roles.map(r => r.toLowerCase());
    if (roles.includes('instructor') || roles.includes('admin') || roles.includes('manager') || roles.includes('lecturer')) {
        next();
    } else {
        res.status(403).json({ error: MESSAGES.AUTH.FORBIDDEN });
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

const express = require('express');
const cors = require('cors');
const path = require('path');
const { isOriginAllowed } = require('./configs/cors.config');

const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const courseRoutes = require('./routes/course.routes');
const userRoutes = require('./routes/user.routes');
const heroBannerRoutes = require('./routes/heroBanner.routes');
const notificationRoutes = require('./routes/notification.routes');
const statsRoutes = require('./routes/stats.routes');

const commentRoutes = require('./routes/comment.routes');
const uploadRoutes = require('./routes/upload.routes');
const quizRoutes = require('./routes/quiz.routes');
const programRoutes = require('./routes/program.routes');
const programRequestRoutes = require('./routes/programRequest.routes');
const sectionRoutes = require('./routes/section.routes');
const categoryRoutes = require('./routes/category.routes');
const courseRequestRoutes = require('./routes/courseRequest.routes');
const departmentRoutes = require('./routes/department.routes');
const positionRoutes = require('./routes/position.routes');
const roleRoutes = require('./routes/role.routes');
const managerRoutes = require('./routes/manager.routes');

const { globalLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.set('trust proxy', 1);

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép không có origin (mobile/curl) hoặc nằm trong whitelist hoặc là subdomain railway
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.log('CORS Blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log('[DEBUG] Body:', JSON.stringify(req.body, null, 2));
        }
    }
    next();
});

// Global Rate Limiting - Move AFTER CORS
app.use(globalLimiter);

// Ép cấu hình chèn Headers cho luồng HLS m3u8/ts để chống lại bảo mật khắt khe của trình duyệt
app.use('/public', express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path, stat) => {
        const origin = res.req.headers.origin;
        if (origin && isOriginAllowed(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE, PATCH');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        // Tắt hoàn toàn Cache để tránh Chrome trả mã ảo 304 làm kẹt luồng HLS gây lỗi 7002
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Đặc trị: Một số trình duyệt khó tính cần định dạng thô nếu là file .key
        if (path.endsWith('.key')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
    }
}));

const errorMiddleware = require('./middlewares/error.middleware');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/course-requests', courseRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/program-requests', programRequestRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/manager', managerRoutes);


// Centralized Error Handling
app.use(errorMiddleware);

module.exports = app;

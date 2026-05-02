const express = require('express');
const cors = require('cors');
const path = require('path');

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

const { globalLimiter } = require('./middlewares/rateLimiter');

const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost', 'http://[IP_ADDRESS]', 'https://securityvideo-web.onrender.com'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        // Allow if origin is in the allowed list, or if it's a railway app, or if it matches the FRONTEND_URL env var
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.up.railway.app') || origin === process.env.FRONTEND_URL) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204
}));

app.use(express.json());

// Global Rate Limiting - Move AFTER CORS
app.use(globalLimiter);

// Ép cấu hình chèn Headers cho luồng HLS m3u8/ts để chống lại bảo mật khắt khe của trình duyệt
app.use('/public', express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path, stat) => {
        const origin = res.req.headers.origin;
        if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app') || origin === process.env.FRONTEND_URL)) {
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


// Centralized Error Handling
app.use(errorMiddleware);

module.exports = app;

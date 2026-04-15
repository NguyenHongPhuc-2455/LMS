const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const courseRoutes = require('./routes/course.routes');
const paymentRoutes = require('./routes/payment.routes');
const userRoutes = require('./routes/user.routes');
const courseRequestRoutes = require('./routes/courseRequest.routes');
const notificationRoutes = require('./routes/notification.routes');
const statsRoutes = require('./routes/stats.routes');

const commentRoutes = require('./routes/comment.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Ép cấu hình chèn Headers cho luồng HLS m3u8/ts để chống lại bảo mật khắt khe của trình duyệt
app.use('/public', express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path, stat) => {
        const origin = res.req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE, PATCH');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        // Tắt hoàn toàn Cache để tránh Chrome trả mã ảo 304 làm kẹt luồng HLS gây lỗi 7002
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Đặc trị: Một số trình duyệt khó tính cần định dạng tệp thô nếu là file .key
        if (path.endsWith('.key')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
    }
}));

const errorMiddleware = require('./middlewares/error.middleware');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/course-requests', courseRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);

// Centralized Error Handling
app.use(errorMiddleware);

module.exports = app;

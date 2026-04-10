const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const courseRoutes = require('./routes/course.routes');
const paymentRoutes = require('./routes/payment.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Ép cấu hình chèn Headers cho luồng HLS m3u8/ts để chống lại bảo mật khắt khe của trình duyệt
app.use('/public', express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
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

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);

module.exports = app;

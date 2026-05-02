require('dotenv').config();
console.log('=== ENV CHECK ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('=================');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});
const http = require('http');
const app = require('./src/app');
const socketUtils = require('./src/utils/socket');

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Khởi tạo Socket.io
socketUtils.init(server);

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Backend đang chạy tại http://localhost:${PORT}`);
    console.log(`Middleware chống tải và nhận dạng Token đã được gắn!`);
    console.log(`Socket.io đã sẵn sàng!`);
    console.log(`========================================\n`);
});

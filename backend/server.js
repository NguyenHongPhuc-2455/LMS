require('dotenv').config();
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

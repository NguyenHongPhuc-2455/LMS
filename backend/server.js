require('dotenv').config();
const config = require('./src/configs/env.config');

console.log('=== ENV CHECK ===');
console.log('PORT:', config.app.port);
console.log('NODE_ENV:', config.app.env);
console.log('DATABASE_URL exists:', !!config.db.url);
console.log('JWT_SECRET exists:', !!config.jwt.secret);
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
const prisma = require('./src/configs/prisma');
const { initNotificationListener } = require('./src/listeners/notification.listener');

// Khởi tạo listeners và queues
initNotificationListener();
require('./src/queues/notification.queue');

// Fix PostgreSQL sequences automatically on startup
async function fixPostgresSequences() {
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"roles"', 'id'), coalesce(max(id), 0) + 1, false) FROM "roles";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"users"', 'id'), coalesce(max(id), 0) + 1, false) FROM "users";`);
        console.log('✅ PostgreSQL sequences synced successfully');
    } catch (err) {
        console.error('⚠️ Could not sync sequences (ignore if not using PostgreSQL):', err.message);
    }
}
fixPostgresSequences();

const server = http.createServer(app);
const PORT = config.app.port;

// Khởi tạo Socket.io
socketUtils.init(server);

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Backend đang chạy tại http://localhost:${PORT}`);
    console.log(`Middleware chống tải và nhận dạng Token đã được gắn!`);
    console.log(`Socket.io đã sẵn sàng!`);
    console.log(`========================================\n`);
});

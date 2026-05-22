const prisma = require('../configs/prisma');
const { initNotificationListener } = require('../listeners/notification.listener');

const logEnvironment = (config) => {
    console.log('=== ENV CHECK ===');
    console.log('PORT:', config.app.port);
    console.log('NODE_ENV:', config.app.env);
    console.log('DATABASE_URL exists:', !!config.db.url);
    console.log('JWT_SECRET exists:', !!config.jwt.secret);
    console.log('=================');
};

const registerProcessHandlers = () => {
    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION:', err.message);
        console.error(err.stack);
    });

    process.on('unhandledRejection', (reason) => {
        console.error('UNHANDLED REJECTION:', reason);
    });
};

const initBackgroundWorkers = () => {
    initNotificationListener();
    require('../queues/notification.queue');
};

const syncPostgresSequences = async () => {
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"roles"', 'id'), coalesce(max(id), 0) + 1, false) FROM "roles";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"users"', 'id'), coalesce(max(id), 0) + 1, false) FROM "users";`);
        console.log('PostgreSQL sequences synced successfully');
    } catch (err) {
        console.error('Could not sync sequences (ignore if not using PostgreSQL):', err.message);
    }
};

const bootstrap = async (config) => {
    logEnvironment(config);
    registerProcessHandlers();
    initBackgroundWorkers();
    syncPostgresSequences();
};

module.exports = {
    bootstrap,
};

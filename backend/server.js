require('dotenv').config();
const config = require('./src/configs/env.config');
const http = require('http');
const app = require('./src/app');
const socketUtils = require('./src/utils/socket');
const { bootstrap } = require('./src/bootstrap/startup');

const server = http.createServer(app);
const PORT = config.app.port;

bootstrap(config)
    .then(() => {
        socketUtils.init(server);

        server.listen(PORT, () => {
            console.log(`\n========================================`);
            console.log(`Backend dang chay tai http://localhost:${PORT}`);
            console.log(`Middleware chong tai va nhan dang Token da duoc gan!`);
            console.log(`Socket.io da san sang!`);
            console.log(`========================================\n`);
        });
    })
    .catch((err) => {
        console.error('Failed to bootstrap server:', err);
        process.exit(1);
    });

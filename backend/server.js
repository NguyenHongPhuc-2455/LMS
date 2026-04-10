require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Backend đang chạy tại http://localhost:${PORT}`);
    console.log(`🛡️ Middleware chống tải và nhận dạng Token đã được gắn!`);
    console.log(`========================================\n`);
});

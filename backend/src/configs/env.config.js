require('dotenv').config();

const config = {
    app: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
    },
    db: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    minio: {
        endpoint: process.env.MINIO_ENDPOINT,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
        bucketName: process.env.MINIO_BUCKET_NAME,
        publicUrl: process.env.MINIO_PUBLIC_URL,
    }
};

// Kiểm tra các biến môi trường bắt buộc
const requiredKeys = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of requiredKeys) {
    if (!process.env[key]) {
        console.error(`[CRITICAL ERROR] Missing required environment variable: ${key}`);
        // Trong môi trường production, bạn có thể uncomment dòng dưới để dừng server nếu thiếu biến bắt buộc
        // process.exit(1); 
    }
}

module.exports = config;

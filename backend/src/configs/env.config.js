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
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    cloudflareR2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        publicUrl: process.env.R2_PUBLIC_URL,
        endpoint: process.env.R2_ENDPOINT,
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

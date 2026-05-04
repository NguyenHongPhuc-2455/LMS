const { S3Client } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
    },
    forcePathStyle: true, // Bắt buộc cho Cloudflare R2
});

const R2_BUCKET = (process.env.R2_BUCKET_NAME || '').trim();
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').trim();

module.exports = { r2Client, R2_BUCKET, R2_PUBLIC_URL };

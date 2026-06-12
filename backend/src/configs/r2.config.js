const { S3Client } = require('@aws-sdk/client-s3');

const minioClient = new S3Client({
    region: 'us-east-1', // MinIO yêu cầu region nhưng giá trị không quan trọng
    endpoint: (process.env.MINIO_ENDPOINT || '').trim(),
    credentials: {
        accessKeyId: (process.env.MINIO_ACCESS_KEY || '').trim(),
        secretAccessKey: (process.env.MINIO_SECRET_KEY || '').trim(),
    },
    forcePathStyle: true, // Bắt buộc cho MinIO (path-style URL)
});

const MINIO_BUCKET = (process.env.MINIO_BUCKET_NAME || '').trim();
const MINIO_PUBLIC_URL = (process.env.MINIO_PUBLIC_URL || '').trim();

module.exports = { minioClient, MINIO_BUCKET, MINIO_PUBLIC_URL };

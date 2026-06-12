/**
 * MinIO Storage Utility
 * Upload, Download, Delete files trên MinIO (S3-compatible)
 */
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { minioClient, MINIO_BUCKET, MINIO_PUBLIC_URL } = require('../configs/r2.config');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

/**
 * Upload một file lên MinIO
 * @param {string} localPath - Đường dẫn file cục bộ
 * @param {string} minioKey - Đường dẫn trên MinIO (ví dụ: hls/5/master.m3u8)
 */
const uploadFile = async (localPath, minioKey) => {
    const fileStream = fs.createReadStream(localPath);
    const contentType = mime.lookup(localPath) || 'application/octet-stream';

    const upload = new Upload({
        client: minioClient,
        params: {
            Bucket: MINIO_BUCKET,
            Key: minioKey,
            Body: fileStream,
            ContentType: contentType,
        },
    });

    await upload.done();
    console.log(`[MinIO] Uploaded: ${minioKey}`);
    return `${MINIO_PUBLIC_URL}/${minioKey}`;
};

/**
 * Upload toàn bộ thư mục lên MinIO
 * @param {string} localDir - Thư mục cục bộ
 * @param {string} minioPrefix - Prefix trên MinIO (ví dụ: hls/5)
 */
const uploadFolder = async (localDir, minioPrefix) => {
    const files = fs.readdirSync(localDir);
    const uploads = files.map(file => {
        const localPath = path.join(localDir, file);
        const minioKey = `${minioPrefix}/${file}`;
        return uploadFile(localPath, minioKey);
    });
    await Promise.all(uploads);
    console.log(`[MinIO] Folder uploaded: ${minioPrefix} (${files.length} files)`);
};

/**
 * Lấy nội dung file từ MinIO dưới dạng Stream
 * @param {string} minioKey - Đường dẫn trên MinIO
 */
const getFileStream = async (minioKey) => {
    const command = new GetObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: minioKey,
    });
    const response = await minioClient.send(command);
    return response;
};

/**
 * Xóa toàn bộ file trong một prefix trên MinIO
 * @param {string} prefix - Ví dụ: hls/5
 */
const deleteFolder = async (prefix) => {
    try {
        const listCmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: prefix,
        });
        const listed = await minioClient.send(listCmd);
        if (!listed.Contents || listed.Contents.length === 0) return;

        for (const obj of listed.Contents) {
            await minioClient.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: obj.Key }));
            console.log(`[MinIO] Deleted: ${obj.Key}`);
        }
    } catch (err) {
        console.error(`[MinIO] Error deleting folder ${prefix}:`, err.message);
    }
};

/**
 * Lấy Presigned URL để trình duyệt tải trực tiếp
 * @param {string} minioKey - Đường dẫn trên MinIO
 * @param {number} expiresIn - Hạn sử dụng của URL (giây)
 */
const getPresignedUrl = async (minioKey, expiresIn = 14400) => {
    const command = new GetObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: minioKey,
    });
    return await getSignedUrl(minioClient, command, { expiresIn });
};

module.exports = { uploadFile, uploadFolder, getFileStream, deleteFolder, getPresignedUrl, MINIO_PUBLIC_URL };

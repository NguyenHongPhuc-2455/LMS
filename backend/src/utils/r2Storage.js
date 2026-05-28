/**
 * Cloudflare R2 Storage Utility
 * Upload, Download, Delete files trên R2 (S3-compatible)
 */
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { r2Client, R2_BUCKET, R2_PUBLIC_URL } = require('../configs/r2.config');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

/**
 * Upload một file lên R2
 * @param {string} localPath - Đường dẫn file cục bộ
 * @param {string} r2Key - Đường dẫn trên R2 (ví dụ: hls/5/master.m3u8)
 */
const uploadFile = async (localPath, r2Key) => {
    const fileStream = fs.createReadStream(localPath);
    const contentType = mime.lookup(localPath) || 'application/octet-stream';

    const upload = new Upload({
        client: r2Client,
        params: {
            Bucket: R2_BUCKET,
            Key: r2Key,
            Body: fileStream,
            ContentType: contentType,
        },
    });

    await upload.done();
    console.log(`[R2] Uploaded: ${r2Key}`);
    return `${R2_PUBLIC_URL}/${r2Key}`;
};

/**
 * Upload toàn bộ thư mục lên R2
 * @param {string} localDir - Thư mục cục bộ
 * @param {string} r2Prefix - Prefix trên R2 (ví dụ: hls/5)
 */
const uploadFolder = async (localDir, r2Prefix) => {
    const files = fs.readdirSync(localDir);
    const uploads = files.map(file => {
        const localPath = path.join(localDir, file);
        const r2Key = `${r2Prefix}/${file}`;
        return uploadFile(localPath, r2Key);
    });
    await Promise.all(uploads);
    console.log(`[R2] Folder uploaded: ${r2Prefix} (${files.length} files)`);
};

/**
 * Lấy nội dung file từ R2 dưới dạng Stream
 * @param {string} r2Key - Đường dẫn trên R2
 */
const getFileStream = async (r2Key) => {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
    });
    const response = await r2Client.send(command);
    return response;
};

/**
 * Xóa toàn bộ file trong một prefix trên R2
 * @param {string} prefix - Ví dụ: hls/5
 */
const deleteFolder = async (prefix) => {
    try {
        const listCmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: prefix,
        });
        const listed = await r2Client.send(listCmd);
        if (!listed.Contents || listed.Contents.length === 0) return;

        for (const obj of listed.Contents) {
            await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key }));
            console.log(`[R2] Deleted: ${obj.Key}`);
        }
    } catch (err) {
        console.error(`[R2] Error deleting folder ${prefix}:`, err.message);
    }
};

/**
 * Lấy Presigned URL để trình duyệt tải trực tiếp
 * @param {string} r2Key - Đường dẫn trên R2
 * @param {number} expiresIn - Hạn sử dụng của URL (giây)
 */
const getPresignedUrl = async (r2Key, expiresIn = 14400) => {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
    });
    return await getSignedUrl(r2Client, command, { expiresIn });
};

module.exports = { uploadFile, uploadFolder, getFileStream, deleteFolder, getPresignedUrl, R2_PUBLIC_URL };

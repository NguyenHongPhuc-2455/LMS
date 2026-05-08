const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// AES-256 cần key chính xác 32 bytes — dùng scryptSync để chuẩn hóa.
const rawKey = process.env.VIDEO_URL_ENCRYPTION_KEY || 'ritavo-lms-default-secret-key-2026';
const ENCRYPTION_KEY = crypto.scryptSync(rawKey, 'ritavo-salt', 32);

/**
 * Tạo token AES chứa url + thời hạn + IP client
 * @param {string} url      URL video gốc (Cloudinary, v.v.)
 * @param {string} clientIp IP của người dùng
 * @param {number} ttlMs    Thời gian sống (ms), mặc định 2 giờ
 */
function createVideoToken(url, clientIp, ttlMs = 5 * 60 * 1000) { // 5 phút
    const payload = JSON.stringify({
        url,
        ip: clientIp || '',
        exp: Date.now() + ttlMs
    });

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(payload, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Giải mã và xác thực token video
 * @param {string} token    Token đã mã hóa
 * @param {string} clientIp IP của người dùng gửi request
 * @returns {string|null}   URL gốc nếu hợp lệ, null nếu lỗi/hết hạn/sai IP
 */
function decodeVideoToken(token, clientIp) {
    try {
        const parts = token.split(':');
        if (parts.length < 2) return null;

        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const payload = JSON.parse(decrypted.toString('utf8'));

        // 1. Kiểm tra thời hạn
        if (!payload.exp || Date.now() > payload.exp) {
            console.warn('[VIDEO TOKEN] Token đã hết hạn');
            return null;
        }

        // 2. Kiểm tra IP (ĐÃ GỠ BỎ THEO YÊU CẦU: Cho phép truy cập công cộng qua proxy)
        /*
        if (payload.ip && clientIp) {
            ...
        }
        */

        return payload; // Trả về toàn bộ object payload
    } catch (err) {
        console.error('[VIDEO TOKEN] Giải mã thất bại:', err.message);
        return null;
    }
}

// Backward-compat shims (dùng cho code cũ gọi encrypt/decrypt trực tiếp)
function encrypt(text, clientIp) { return createVideoToken(text, clientIp || ''); }
function decrypt(text) { return decodeVideoToken(text, null); }

module.exports = { createVideoToken, decodeVideoToken, encrypt, decrypt };

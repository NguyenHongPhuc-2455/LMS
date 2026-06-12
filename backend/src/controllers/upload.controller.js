const path = require('path');
const fs = require('fs');
const { uploadFile } = require('../utils/r2Storage');

exports.uploadImage = async (req, res) => {
    console.log('[DEBUG] Uploading image to MinIO:', req.file?.originalname);
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
        }

        // Tạo key lưu trữ trên MinIO
        const minioKey = `images/${req.file.filename}`;

        // Upload lên MinIO
        const publicUrl = await uploadFile(req.file.path, minioKey);

        // Xóa file tạm cục bộ sau khi upload thành công
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            url: publicUrl,
            filename: req.file.filename
        });
    } catch (error) {
        // Xóa file tạm cục bộ nếu gặp lỗi
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('[UPLOAD ERROR]', error);
        res.status(500).json({ error: error.message });
    }
};

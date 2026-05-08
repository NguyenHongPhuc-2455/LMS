const path = require('path');
const fs = require('fs');

exports.uploadImage = async (req, res) => {
    console.log('[DEBUG] Uploading image:', req.file?.originalname);
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
        }

        // multer-storage-cloudinary provides the URL in req.file.path
        res.json({
            url: req.file.path,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

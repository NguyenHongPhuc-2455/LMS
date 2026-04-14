const path = require('path');
const fs = require('fs');

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng chọn ảnh' });
        }

        // Tạo URL cho ảnh
        const imageUrl = `http://localhost:5000/public/thumbnails/${req.file.filename}`;

        res.json({
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

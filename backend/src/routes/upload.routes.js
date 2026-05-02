const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../configs/cloudinary.config');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'security_video_thumbnails',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => 'thumb-' + Date.now(),
    },
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

router.post('/image', authMiddleware.verifyToken, upload.single('image'), uploadController.uploadImage);

module.exports = router;

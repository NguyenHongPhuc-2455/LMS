const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../configs/settings.json');

// Đọc settings từ file, nếu chưa có thì tạo mặc định
const getSettings = () => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Lỗi đọc settings.json:', e);
    }
    
    // Mặc định
    const defaultSettings = {
        ngrok_fe_url: 'https://unperceptive-sau-divaricately.ngrok-free.dev',
        ngrok_be_url: 'https://frostbite-payphone-rerun.ngrok-free.dev',
        show_sharing_link: true
    };
    
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    } catch (e) {
        console.error('Lỗi ghi settings.json mặc định:', e);
    }
    return defaultSettings;
};

// Middleware kiểm tra quyền
const { verifyToken, isAdminOrManager } = require('../middlewares/auth.middleware');

router.get('/settings', (req, res) => {
    const settings = getSettings();
    res.json({ status: 'success', data: settings });
});

router.post('/settings', verifyToken, isAdminOrManager, (req, res) => {
    const roles = req.user.roles || [];
    const isManagerOrAdmin = roles.includes('admin') || roles.includes('manager') || roles.includes('instructor');
    
    if (!isManagerOrAdmin) {
        return res.status(403).json({ status: 'error', message: 'Bạn không có quyền thay đổi cấu hình hệ thống' });
    }
    
    const { ngrok_fe_url, ngrok_be_url, show_sharing_link } = req.body;
    const settings = getSettings();
    
    if (ngrok_fe_url !== undefined) settings.ngrok_fe_url = ngrok_fe_url;
    if (ngrok_be_url !== undefined) settings.ngrok_be_url = ngrok_be_url;
    if (show_sharing_link !== undefined) settings.show_sharing_link = show_sharing_link;
    
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        res.json({ status: 'success', message: 'Đã lưu cấu hình hệ thống', data: settings });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Không thể ghi tệp cấu hình: ' + e.message });
    }
});

module.exports = router;

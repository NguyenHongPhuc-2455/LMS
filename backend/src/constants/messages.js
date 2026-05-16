const MESSAGES = {
    AUTH: {
        UNAUTHORIZED: 'Truy cập bị từ chối. Vui lòng đăng nhập.',
        INVALID_TOKEN: 'Token không hợp lệ hoặc đã bị chỉnh sửa.',
        FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
        ADMIN_REQUIRED: 'Chỉ Admin mới có quyền thực hiện hành động này.',
        ADMIN_MANAGER_REQUIRED: 'Chỉ Admin hoặc Manager mới có quyền thực hiện hành động này.',
        LOGIN_FAILED: 'Sai tài khoản hoặc mật khẩu.',
        USER_EXISTS: 'Username hoặc Email đã tồn tại.',
        REFRESH_TOKEN_REQUIRED: 'Refresh Token là bắt buộc.',
        REFRESH_TOKEN_INVALID: 'Refresh Token không hợp lệ hoặc đã hết hạn.'
    },
    SYSTEM: {
        MISSING_CONFIG: 'Hệ thống chưa được cấu hình đầy đủ (Thiếu biến môi trường).',
        SERVER_ERROR: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.'
    }
};

module.exports = MESSAGES;

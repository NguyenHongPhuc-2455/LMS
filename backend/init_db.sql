-- Tạo bảng Roles (Phân quyền)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Thêm một số Role cơ bản
INSERT INTO roles (name, description) VALUES 
('admin', 'Quản trị viên hệ thống'),
('student', 'Học viên (cần check quyền xem video)'),
('guest', 'Khách truy cập tự do')
ON CONFLICT (name) DO NOTHING;

-- Tạo bảng Users (Tài khoản người dùng)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng Courses (Khoá học)
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng Videos (Các video bài giảng)
-- Bảng này rất quan trọng để cấu hình luồng HLS/DASH và khóa mã hóa
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    
    -- Lưu trữ URL tới file m3u8 hoặc mpd (tệp playlist HLS/DASH)
    -- Không ai sẽ có được link MP4 gốc.
    manifest_url VARCHAR(255) NOT NULL, 
    
    -- Các trường dùng cho mã hoá / DRM
    drm_key_id VARCHAR(100), -- ID của Khoá (VD: KID trong Widevine hay AES)
    drm_key_secret VARCHAR(255), -- Khóa bí mật thật (Dùng để trả về cho Shaka/VideoJS nếu User hợp lệ)
    
    is_public BOOLEAN DEFAULT false, -- Nội dung có bị khoá hay không
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng phân quyền xem (Ai được xem khoá nào)
CREATE TABLE IF NOT EXISTS user_course_access (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);

-- =========================================================
-- DỮ LIỆU DEMO MẪU (DUMMY DATA TẠO THỬ ĐỂ TEST)
-- =========================================================

-- Tạo 2 User demo
INSERT INTO users (username, email, password_hash, role_id) VALUES 
('nguyenvana', 'nga@example.com', 'hash_mat_khau_ne', (SELECT id FROM roles WHERE name = 'student')),
('admin_quan', 'quan@example.com', 'hash_admin', (SELECT id FROM roles WHERE name = 'admin'))
ON CONFLICT (username) DO NOTHING;

-- Tạo khoá học Demo
INSERT INTO courses (title, description) VALUES 
('Khóa học lập trình Bảo Mật Video', 'Hướng dẫn sử dụng FFmpeg, Shaka Player')
ON CONFLICT DO NOTHING;

-- Tạo Video được bảo vệ bằng luồng HLS/DASH
INSERT INTO videos (course_id, title, manifest_url, drm_key_id, drm_key_secret, is_public) VALUES 
((SELECT id FROM courses LIMIT 1), 'Bài 1: Tổng quan phân mảnh HLS', 'https://example.com/hls/bai1/index.m3u8', 'my_aes_key_id_001', 'secret_key_123456_abcdef', false)
ON CONFLICT DO NOTHING;

-- Cấp quyền truy cập cho sinh viên Nguyễn Văn A
INSERT INTO user_course_access (user_id, course_id) VALUES 
((SELECT id FROM users WHERE username = 'nguyenvana'), (SELECT id FROM courses LIMIT 1))
ON CONFLICT DO NOTHING;

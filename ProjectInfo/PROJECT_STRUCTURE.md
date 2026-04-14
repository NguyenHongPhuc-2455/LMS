# Project Architecture & Map (RitaVo LMS)

Tài liệu này giúp AI hoặc Developer nắm bắt nhanh cấu trúc và luồng hoạt động của dự án.

## 📝 Tổng quan dự án
- **Tên**: RitaVo LMS (Learning Management System)
- **Mục tiêu**: Hệ thống học tập trực tuyến tập trung vào bảo mật video HLS.
- **Mô hình**: Fullstack (Node.js Backend & React Frontend) chạy dưới dạng Single Page Application (SPA).

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express, Prisma (ORM), PostgreSQL, FFmpeg (Xử lý video).
- **Frontend**: React (Vite), TypeScript, Ant Design (UI), React Router (Routing).
- **Security**: JWT (Auth), AES-128 Encryption (HLS Video Key).

---

## 📂 Sơ đồ cấu trúc (Directory Tree)

```text
/
├── backend/                       # Server & API
│   ├── prisma/                    # Schema & Database Migrations
│   ├── src/
│   │   ├── configs/               # Cấu hình hệ thống (Prisma, DB)
│   │   ├── controllers/           # Nhận Request & Trả Response
│   │   ├── services/              # (Core) Logic nghiệp vụ chính
│   │   ├── routes/                # Luồng API
│   │   ├── middlewares/           # Auth, Upload, Error Handler
│   │   ├── utils/                 # ApiError, catchAsync wrapper
│   │   └── app.js                 # Cấu hình Express
│   └── server.js                  # Entry point (Port 5000)
│
├── frontend/sercurityVideo/       # React SPA
│   ├── src/
│   │   ├── assets/                # Styles, Images
│   │   ├── components/            # MainLayout, AdminLayout, Navbar, VideoPlayer
│   │   ├── pages/                 # Phân chia theo vai trò
│   │   │   ├── admin/             # Dashboard, UserManagement, AdminDashboard
│   │   │   ├── client/            # CourseList, Detail, Learning, Profile, MyCourses
│   │   │   └── Login, Register    # Các trang Public
│   │   ├── services/              # API Client (axios instances)
│   │   ├── App.tsx                # SPA Routing & ConfigProvider
│   │   └── main.tsx               # Entry point (Vite)
│
├── docker-compose.yml             # PostgreSQL Setup
├── README.md                      # Hướng dẫn cài đặt chính
└── PROJECT_STRUCTURE.md           # Tài liệu này
```

---

## 🌊 Luồng hoạt động chính (Workflows)

### 1. Luồng xử lý Video (Security First)
`Upload Video` -> `Multer` -> `VideoController` -> `VideoService` -> `FFmpeg`:
- Video được băm thành phân đoạn (.ts).
- Tạo mã hóa AES-128 và lưu File Key tạm.
- Lưu Key Binary trực tiếp vào PostgreSQL (`hls_key`).
- Trả về đường dẫn Manifest (.m3u8).

### 2. Luồng xem Video (SPA Flow)
`Course Page` -> `VideoPlayer Component`:
- Player gọi manifest `.m3u8`.
- Trình duyệt yêu cầu Key giải mã từ API `/api/videos/key/:id`.
- `AuthMiddleware` kiểm tra Token & Quyền sở hữu khóa học.
- Trả về Key Binary để giải mã luồng video tại chỗ.

### 3. Mô hình Error Handling (Professional)
- Mọi lỗi được đóng gói qua `ApiError`.
- `catchAsync` tự động bắt lỗi từ block Async/Await.
- `error.middleware.js` chuyển đổi mọi lỗi thành JSON chuẩn cho Frontend.

---

## 📑 Các file quan trọng cần đọc trước
1. `backend/src/services/video.service.js`: Chứa logic tối ưu hóa FFmpeg.
2. `backend/prisma/schema.prisma`: Thiết kế DB.
3. `frontend/src/App.tsx`: Cấu hình Router & Layout SPA.
4. `frontend/src/components/MainLayout.tsx`: Khung xương Layout SPA.

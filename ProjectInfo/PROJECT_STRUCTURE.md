# Project Architecture & Map (RitaVo LMS)

Tài liệu này giúp AI hoặc Developer nắm bắt nhanh cấu trúc và luồng hoạt động của dự án.

## 📝 Tổng quan dự án
- **Tên**: RitaVo LMS (Learning Management System)
- **Mục tiêu**: Hệ thống học tập trực tuyến tập trung vào bảo mật video HLS.
- **Mô hình**: Fullstack (Node.js Backend & React Frontend) chạy dưới dạng Single Page Application (SPA).

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express, Prisma (ORM), PostgreSQL, FFmpeg (Xử lý video), Socket.io (Realtime).
- **Frontend**: React (Vite), TypeScript, Ant Design (UI), React Router (Routing), dayjs (Date formatting).
- **Security**: JWT (Auth), AES-128 Encryption (HLS Video Key).
- **Realtime**: Socket.io cho thông báo push (Notification) và tương tác trực tiếp.

---

## 📂 Sơ đồ cấu trúc (Directory Tree)

```text
/
├── backend/                       # Server & API
│   ├── prisma/                    # Schema & Database Migrations
│   ├── src/
│   │   ├── configs/               # Cấu hình hệ thống (Prisma, DB)
│   │   ├── controllers/           # Nhận Request & Trả Response
│   │   │   ├── category.controller.js # Quản lý danh mục
│   │   │   ├── courseRequest.controller.js # Duyệt yêu cầu khóa học
│   │   │   ├── programRequest.controller.js # Duyệt yêu cầu lộ trình
│   │   │   ├── stats.controller.js    # Thống kê & Tiến độ
│   │   │   ├── comment.controller.js  # CRUD bình luận
│   │   │   └── notification.controller.js # Quản lý thông báo
│   │   ├── services/              # (Core) Logic nghiệp vụ chính
│   │   │   ├── category.service.js    # Logic danh mục
│   │   │   ├── courseRequest.service.js # Logic duyệt yêu cầu
│   │   │   ├── stats.service.js       # Tính toán tiến độ học viên
│   │   │   ├── comment.service.js     # Logic bình luận (Facebook-style 2 cấp)
│   │   │   └── notification.service.js # Tạo & phát thông báo Realtime
│   │   ├── routes/                # Luồng API
│   │   │   ├── category.routes.js     # /api/categories/*
│   │   │   ├── course-request.routes.js # /api/course-requests/*
│   │   │   ├── stats.routes.js        # /api/stats/*
│   │   │   ├── comment.routes.js      # /api/comments/*
│   │   │   └── notification.routes.js # /api/notifications/*
│   │   ├── middlewares/           # Auth, Upload, validate, rateLimiter, Error Handler
│   │   ├── utils/                 # ApiError, catchAsync, socket.js, streamToken.js (New)
│   │   └── app.js                 # Cấu hình Express (Cài đặt Proxy Stream)
│   ├── scripts/                   # Các script quản lý database, seed dữ liệu
│   └── server.js                  # Entry point (Port 5000, Socket.io)
│
├── frontend/securityVideo/       # React SPA
│   ├── src/
│   │   ├── styles/                # Global Style System (RitaVo Red, Glassmorphism)
│   │   ├── components/            # Modular Components (Standardized Admin Components)
│   │   ├── hooks/                 # Custom React Hooks
│   │   ├── pages/                 # Admin modules (Course, Lesson, Category, Request, Progress, User)
│   │   ├── services/              # API Client (Shared axios services)
│   │   ├── App.tsx                # SPA Routing
│   │   └── main.tsx               # Entry point
│   ├── tsconfig.app.json          # Cấu hình Absolute Imports (@/* -> ./src/*)
│   └── vite.config.ts             # Cấu hình Resolve Alias (@)

│
├── docker-compose.yml             # PostgreSQL Setup
├── README.md                      # Hướng dẫn cài đặt chính
└── PROJECT_STRUCTURE.md           # Tài liệu này
```

---

## 🌊 Luồng hoạt động chính (Workflows)

### 1. Luồng xử lý Video Đa nguồn
`Upload/Import Video` -> `VideoService`:
- **HLS**: Cắt nhỏ (.ts), mã hóa AES-128, lưu Key vào DB. Bảo mật cao nhất.
- **Signed URL & Proxy**: Video không phát trực tiếp từ thư mục tĩnh. Mọi request đi qua Proxy `/api/videos/stream` có kiểm tra IP Binding và thời hạn Token (2 giờ).
- **YouTube/Direct Link**: Lưu URL và thời lượng. Player tự động nhận diện nguồn.
- **Tracking**: Hệ thống theo dõi chính xác thời gian xem. Khi đạt **95-99%** thời lượng, bài học tự động được đánh dấu hoàn thành.

### 2. Luồng Duyệt yêu cầu & Tiến độ
`Student Registration` -> `Admin Dashboard` -> `Approval`:
- Khi học viên đăng ký khóa học/lộ trình riêng tư, yêu cầu được đẩy về `CourseRequestManagement`.
- Admin duyệt -> Học viên được cấp quyền truy cập (`enrollment`).
- Admin có thể xem **Tiến độ học tập** theo thời gian thực (phần trăm hoàn thành) của từng học viên.

### 3. Luồng Bình luận (Facebook-style, 2 cấp)
`CourseLearning` -> `CommentSection` -> `commentService` -> Backend:
- Cấp 1: Parent Comment (bình luận gốc).
- Cấp 2: Reply (phản hồi). Mọi phản hồi lồng sâu hơn đều được **gộp về cấp 2** (giống Facebook).
- Backend tự resolve `parent_id` để đảm bảo cấu trúc tối đa 2 cấp.

### 4. Luồng Thông báo Realtime (Socket.io)
`Comment Reply` -> `notificationService.createNotification()` -> `Socket.io emit`:
- Khi tạo reply, backend tìm chủ bình luận cha và tạo thông báo.
- Thông báo kèm `link` điều hướng (VD: `/course/2/learning?lessonId=5#comment-42`).
- Frontend lắng nghe event `newNotification` qua Socket.io và hiện toast.
- Khi click thông báo, navigate tới bài học đúng và scroll tới bình luận cụ thể (highlight vàng 2.5s).

### 5. Mô hình Error Handling (Professional)
- Mọi lỗi được đóng gói qua `ApiError`.
- `catchAsync` tự động bắt lỗi từ block Async/Await.
- `error.middleware.js` chuyển đổi mọi lỗi thành JSON chuẩn cho Frontend.

---

## 📑 Các file quan trọng cần đọc trước
1. `backend/src/services/video.service.js`: Chứa logic tối ưu hóa FFmpeg.
2. `backend/prisma/schema.prisma`: Thiết kế DB (bao gồm Comment, Notification).
3. `backend/src/services/comment.service.js`: Logic bình luận Facebook-style.
4. `backend/src/services/notification.service.js`: Logic thông báo Realtime.
5. `frontend/src/App.tsx`: Cấu hình Router & Layout SPA.
6. `frontend/src/components/CommentSection.tsx`: Giao diện bình luận.
7. `frontend/src/components/AppHeader.tsx`: Header với Notification Bell.

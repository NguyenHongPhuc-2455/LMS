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
│   │   │   ├── auth.controller.js     # Đăng ký, Đăng nhập, Refresh Token
│   │   │   ├── user.controller.js     # Quản lý thành viên & Hồ sơ
│   │   │   ├── course.controller.js   # Quản lý khóa học & Nội dung bài học
│   │   │   ├── program.controller.js  # Quản lý lộ trình học tập
│   │   │   ├── category.controller.js # Quản lý danh mục
│   │   │   ├── courseRequest.controller.js # Duyệt yêu cầu khóa học
│   │   │   ├── programRequest.controller.js # Duyệt yêu cầu lộ trình
│   │   │   ├── stats.controller.js    # Thống kê & Tiến độ
│   │   │   ├── comment.controller.js  # CRUD bình luận
│   │   │   ├── notification.controller.js # Quản lý thông báo
│   │   │   └── manager.controller.js  # API phân hệ Line Manager (New)
│   │   ├── services/              # (Core) Logic nghiệp vụ chính
│   │   │   ├── auth.service.js        # Logic xác thực & JWT
│   │   │   ├── user.service.js        # Logic người dùng & phân quyền
│   │   │   ├── course.service.js      # Logic khóa học & Xử lý cascade delete
│   │   │   ├── program.service.js     # Logic lộ trình & Tiến độ học tập
│   │   │   ├── video.service.js       # Logic dọn dẹp R2 & Xử lý video
│   │   │   ├── category.service.js    # Logic danh mục
│   │   │   ├── courseRequest.service.js # Logic duyệt yêu cầu
│   │   │   ├── stats.service.js       # Tính toán tiến độ nhân sự
│   │   │   ├── comment.service.js     # Logic bình luận (Facebook-style 2 cấp)
│   │   │   └── notification.service.js # Tạo & phát thông báo Realtime

│   │   ├── routes/                # Luồng API
│   │   │   ├── category.routes.js     # /api/categories/*
│   │   │   ├── course-request.routes.js # /api/course-requests/*
│   │   │   ├── stats.routes.js        # /api/stats/*
│   │   │   ├── comment.routes.js      # /api/comments/*
│   │   │   ├── notification.routes.js # /api/notifications/*
│   │   │   └── manager.routes.js      # /api/manager/* (New)
│   │   ├── middlewares/           # Auth, Upload, validate, rateLimiter, Error Handler
│   │   ├── utils/                 # ApiError, catchAsync, socket.js, streamToken.js, scope.js (New)
│   │   └── app.js                 # Cấu hình Express (Cài đặt Proxy Stream)
│   ├── scripts/                   # Các script quản lý database, seed dữ liệu
│   └── server.js                  # Entry point (Port 5000, Socket.io)
│
├── frontend/securityVideo/       # React SPA
│   ├── src/
│   │   ├── styles/                # Global Style System (RitaVo Red, Glassmorphism)
│   │   ├── components/            # Modular Components (Standardized Admin Components)
│   │   ├── constants/             # Hệ thống hằng số (Routes, Configs)
│   │   │   └── routes.ts          # Quản lý tập trung toàn bộ URL trong app
│   │   ├── hooks/                 # Custom React Hooks
│   │   ├── pages/                 # Admin modules + Manager (ManagerEmployees, ManagerInactiveReport) (New)
│   │   ├── services/              # API Client + manager.service.ts (New)
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
- Khi nhân sự đăng ký khóa học/lộ trình riêng tư, yêu cầu được đẩy về `CourseRequestManagement`.
- Admin duyệt -> nhân sự được cấp quyền truy cập (`enrollment`).
- Admin có thể xem **Tiến độ học tập** theo thời gian thực (phần trăm hoàn thành) của từng nhân sự.

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

### 5. Luồng Quản lý Phòng ban (Line Manager Subsystem)
- **Phân quyền và bảo mật**: Manager chỉ được thao tác với nhân viên thuộc phòng ban (`department_id`) của mình. Logic này được chặn chặt chẽ ở tầng Controller.
- **Thống kê & Giám sát**: Manager theo dõi tiến độ các khóa học của cấp dưới, tìm kiếm lọc theo chức danh/họ tên.
- **Báo cáo Inactive**: Liệt kê các nhân sự chậm tiến độ (tổng thời lượng học bằng 0 hoặc 0 bài học hoàn thành trong N ngày qua).
- **Đôn đốc realtime**: Manager gửi tin nhắn nhắc nhở trực tiếp -> DB lưu notification -> Socket.io đẩy Toast tức thì đến trình duyệt của học viên.

### 6. Luồng Phân Phối Lộ Trình & Ràng Buộc Thời Hạn (Intelligent Scoping)
- **Đa dạng phạm vi áp dụng (Scoping)**: Áp dụng Lộ trình học/Khóa học bắt buộc cho Toàn bộ nhân viên, Phòng ban, Vị trí, Nhân viên cụ thể hoặc Chỉ dành cho Nhân viên mới (dưới 90 ngày kể từ ngày vào làm `join_date`).
- **Xác thực tự động**: `isUserInScope` trong `backend/src/utils/scope.js` kiểm tra quyền truy cập của user khi truy cập hoặc đăng ký khóa học/lộ trình.
- **Ràng buộc thời hạn hoàn thành (Deadline Guard)**: Backend chặn không cho phép cấu hình thời hạn hoàn thành Lộ trình học ngắn hơn thời hạn hoàn thành của bất kỳ khóa học con nào thuộc lộ trình đó.

### 7. Mô hình Error Handling (Professional)
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

# Project Architecture & Map (RitaVo LMS)

Tài liệu này giúp AI hoặc Developer nắm bắt nhanh cấu trúc và luồng hoạt động của dự án.

## 📝 Tổng quan dự án
- **Tên**: RitaVo LMS (Learning Management System)
- **Mục tiêu**: Hệ thống học tập trực tuyến tập trung vào bảo mật video HLS.
- **Mô hình**: Fullstack (Node.js Backend & React Frontend) chạy dưới dạng Single Page Application (SPA).

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express, Prisma (ORM), PostgreSQL, FFmpeg (Xử lý video), Socket.io (Realtime).
- **Queue/Cache**: BullMQ + Redis (Hàng đợi xử lý video nền & caching thống kê).
- **Frontend**: React (Vite), TypeScript, Ant Design (UI), React Router (Routing), dayjs (Date formatting).
- **Security**: JWT (Auth), AES-128 Encryption (HLS Video Key).
- **Realtime**: Socket.io cho thông báo push (Notification) và tương tác trực tiếp.
- **Infrastructure**: Docker & Docker Compose (đóng gói và triển khai toàn bộ dự án).

---

## 📂 Sơ đồ cấu trúc (Directory Tree)

```text
/
├── backend/                       # Server & API
│   ├── prisma/                    # Schema & Database Migrations
│   ├── src/
│   │   ├── configs/               # Cấu hình hệ thống (Prisma, DB, Redis)
│   │   │   └── redis.config.js    # ★ Cấu hình kết nối Redis (BullMQ & Cache)
│   │   ├── queues/                # ★ Hàng đợi BullMQ
│   │   │   ├── videoTranscode.queue.js  # Queue xử lý video (có Fallback In-Memory)
│   │   │   └── notification.queue.js    # Queue thông báo
│   │   ├── controllers/           # Nhận Request & Trả Response
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── course.controller.js
│   │   │   ├── program.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── courseRequest.controller.js
│   │   │   ├── programRequest.controller.js
│   │   │   ├── stats.controller.js
│   │   │   ├── comment.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── video.controller.js    # ★ Upload → đẩy job vào Queue thay vì xử lý thẳng
│   │   │   └── manager.controller.js
│   │   ├── services/              # (Core) Logic nghiệp vụ chính
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── course.service.js
│   │   │   ├── program.service.js
│   │   │   ├── video.service.js       # processVideoToHLS() - được gọi bởi Worker hoặc Fallback
│   │   │   ├── category.service.js
│   │   │   ├── courseRequest.service.js
│   │   │   ├── stats.service.js       # ★ getDashboardStats() có Redis Cache (5 phút TTL)
│   │   │   ├── comment.service.js
│   │   │   └── notification.service.js
│   │   ├── routes/                # Luồng API
│   │   │   ├── category.routes.js
│   │   │   ├── course-request.routes.js
│   │   │   ├── stats.routes.js
│   │   │   ├── comment.routes.js
│   │   │   ├── notification.routes.js
│   │   │   └── manager.routes.js
│   │   ├── middlewares/           # Auth, Upload, validate, rateLimiter (★ theo userId), Error Handler
│   │   ├── utils/                 # ApiError, catchAsync, socket.js, streamToken.js, scope.js
│   │   └── app.js                 # Cấu hình Express
│   ├── scripts/                   # Các script quản lý database, seed dữ liệu
│   ├── worker.js                  # ★ Tiến trình Worker độc lập xử lý video qua BullMQ
│   ├── .dockerignore              # ★ Loại trừ node_modules khi build Docker
│   ├── Dockerfile                 # ★ Multi-stage build tối ưu dung lượng
│   └── server.js                  # Entry point (Port 5000, Socket.io)
│
├── frontend/securityVideo/       # React SPA
│   ├── src/
│   │   ├── styles/
│   │   ├── components/
│   │   ├── constants/
│   │   │   └── routes.ts
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   └── client/CourseLearning/  # ★ Heartbeat tối ưu: 60s, dừng khi video paused
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .dockerignore              # ★ Loại trừ node_modules & dist khi build Docker
│   ├── Dockerfile                 # ★ Multi-stage: node:20-alpine build → nginx:alpine serve
│   └── vite.config.ts
│
├── docker-compose.yml             # ★ Đầy đủ: PostgreSQL + Redis + Backend + Frontend
├── README.md
└── PROJECT_STRUCTURE.md
```

---

## 🌊 Luồng hoạt động chính (Workflows)

### 1. Luồng xử lý Video (BullMQ Async Transcoding)
`Upload Video` → `video.controller.js` → **Đẩy Job vào BullMQ Queue** → Trả `202 Accepted` ngay:
- **Khi Redis Online**: Job được đẩy vào `video-transcoding` queue → `worker.js` (tiến trình độc lập) lấy job và chạy FFmpeg. API Server không bị chiếm CPU.
- **Khi Redis Offline (Fallback)**: Job được xử lý ngay trên luồng nền của Server (In-Memory via `setImmediate`). Hệ thống tự phục hồi, không crash.
- **HLS**: FFmpeg cắt nhỏ (.ts), mã hóa AES-128, lưu Key vào DB, upload lên Cloudflare R2.
- **Proxy Stream**: Mọi request đi qua `/api/videos/stream` có kiểm tra IP Binding và Token (2 giờ).
- **Tracking (Tối ưu)**: Heartbeat từ Client gửi mỗi **60 giây** (tăng từ 30s) và **tự dừng khi video paused**, giảm 50% tải DB.
- **YouTube/Direct Link**: Lưu URL, Player tự nhận diện nguồn.

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

### 8. Hệ thống Cache & Queue (Performance Layer)
- **Redis Cache**: `getDashboardStats` được cache 5 phút. Giảm tải truy vấn phức tạp xuống còn <5ms.
- **BullMQ Queue**: Video transcoding chạy hoàn toàn ngoài luồng HTTP. Worker (`worker.js`) chạy song song như một tiến trình độc lập.
- **Rate Limiter thông minh**: Sử dụng `userId` làm key thay vì IP để tránh block nhầm khi 100+ user dùng chung mạng NAT. Nới lỏng lên 5000 req/15 phút cho user đã đăng nhập.

---

## 📑 Các file quan trọng cần đọc trước
1. `backend/src/services/video.service.js`: Chứa logic tối ưu hóa FFmpeg.
2. `backend/prisma/schema.prisma`: Thiết kế DB (bao gồm Comment, Notification).
3. `backend/src/services/comment.service.js`: Logic bình luận Facebook-style.
4. `backend/src/services/notification.service.js`: Logic thông báo Realtime.
5. `frontend/src/App.tsx`: Cấu hình Router & Layout SPA.
6. `frontend/src/components/CommentSection.tsx`: Giao diện bình luận.
7. `frontend/src/components/AppHeader.tsx`: Header với Notification Bell.

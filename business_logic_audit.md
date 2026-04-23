# Business Logic Audit Report - LMS Project

## 1. Tổng quan hệ thống
Dự án LMS hiện tại sử dụng kiến trúc Express.js kết hợp Prisma ORM, PostgreSQL và Socket.io. Hệ thống hỗ trợ khóa học Video bảo mật cao bằng chuẩn HLS (AES-128 Encryption).

## 2. Các vấn đề Logic & Rủi ro bảo mật

### 2.1. Lỗ hổng Phân quyền (Broken Object Level Authorization) (Đã sửa)
- **Vấn đề**: Hầu hết các tuyến đường (routes) quản lý khóa học (`POST /api/courses`, `PUT /api/courses/:id`, `POST /api/sections`) chỉ sử dụng `verifyToken` mà không đi kèm `isAdmin` hoặc kiểm tra quyền Instructor.
- **Rủi ro**: Một học viên (Student) nếu biết ID hoặc dùng Tool (Postman) có thể tự tạo khóa học hoặc sửa nội dung khóa học của giáo viên khác.
- **Vị trí**: `backend/src/routes/course.routes.js`, `backend/src/routes/video.routes.js`.

### 2.2. Kiểm soát truy cập Key Video chưa chặt chẽ (Đã sửa)
- **Vấn đề**: Endpoint `/api/videos/key/:lessonId` chỉ kiểm tra token hợp lệ (`verifyToken`).
- **Rủi ro**: Bất kỳ người dùng nào đã đăng nhập đều có thể lấy được Key giải mã video của bất kỳ bài học nào, miễn là biết `lessonId`, kể cả khi chưa mua/enroll khóa học đó.
- **Khuyến nghị**: Cần kiểm tra xem `req.user.id` có quyền `Enrollment` cho khóa học chứa `lessonId` đó hay không trước khi trả về Key.

### 2.3. Race Condition trong Xử lý Video (HLS Transcoding) (Đã sửa)
- **Vấn đề**: Hàm `ensureHLS` trong `video.service.js` kiểm tra file tồn tại. Nếu chưa có, nó sẽ bắt đầu băm video từ `source_url`.
- **Rủi ro**: Nếu 10 học viên cùng truy cập một bài học mới chưa được băm cùng lúc, hệ thống sẽ spawn 10 tiến trình FFmpeg đồng thời, gây quá tải CPU (CPU Spikes) và có thể làm sập Server.
- **Khuyến nghị**: Sử dụng cơ chế Queue (như BullMQ) hoặc ít nhất là một biến "Processing Lock" trong bộ nhớ/Redis để đảm bảo mỗi Video chỉ được băm 1 lần.

### 2.4. Logic Hoàn thành Bài học (Lesson Completion) (Đã sửa)
- **Vấn đề**: Logic đánh dấu hoàn thành nằm trực tiếp trong file Route (`video.routes.js`), không qua Controller hay Service.
- **Inconsistent**: Việc lồng logic nghiệp vụ vào Route khiến việc bảo trì và kiểm soát (ví dụ: cộng điểm thưởng, bắn event socket) trở nên khó khăn.
- **Khuyến nghị**: Chuyển logic này vào `CourseController` hoặc `ProgressService`.

### 2.5. Xử lý Soft Delete chưa nhất quán
- **Vấn đề**: Model `User`, `Course`, `LearningProgram` có trường `deleted_at`, nhưng một số câu lệnh `findMany` hoặc `findUnique` chưa lọc điều kiện `deleted_at: null`.
- **Hệ quả**: Dữ liệu đã xóa vẫn có thể xuất hiện trong các báo cáo thống kê hoặc tìm kiếm profile.

## 3. Đề xuất Cải thiện Kỹ thuật

### 3.1. Validation Dữ liệu (Đã sửa)
- Nên áp dụng schema validation (Joi hoặc Zod) đồng nhất cho tất cả các Request Body để tránh lỗi ép kiểu dữ liệu từ Prisma (ví dụ: Gửi chuỗi cho trường Int).

### 3.2. Quản lý Video
- **Duration**: Hiện tại thời lượng video được lấy qua `ffprobe` trong lúc băm. Nếu băm lỗi, duration = 0. Cần có cơ chế retry hoặc cho phép Admin cập nhật manual nếu cần.
- **Clean up**: Khi xóa một bài học, hệ thống đã xóa folder HLS, nhưng chưa xóa các `CourseRequest` liên quan (nếu có), dẫn đến rác dữ liệu trong DB.

### 3.3. Hiệu suất & Cache
- **Stats Service**: Hiện đang tính toán trực tiếp từ DB mỗi lần có request. Nên sử dụng Redis để cache các con số tổng quát (Tổng học viên, Tổng khóa học) và chỉ invalidate khi có thay đổi lớn.

## 4. Kết luận
Hệ thống có nền tảng tốt về bảo mật nội dung (HLS Encryption), nhưng cần siết chặt lại các lớp Auth ở mức API và tối ưu hóa các tác vụ tiêu tốn tài nguyên (FFmpeg) để có thể mở rộng (Scale up) cho số lượng người dùng lớn.

1. Nhóm quản lý Người dùng (Users & Roles)
Đây là nền tảng để phân quyền giữa nhân sự (Student), Giảng viên (Instructor) và Admin.

- **users**: Lưu thông tin cơ bản (id, email, password, full_name, avatar, bio, phone, dob, gender, employee_id, department, position, join_date).
- **roles**: Lưu các loại quyền (Admin, Instructor, Student).
- **user_roles**: Bảng trung gian kết nối `users` và `roles` (quan hệ n-n).

2. Nhóm nội dung Khóa học (Courses & Content)
Đây là phần phức tạp nhất, cấu trúc theo phân cấp: Khóa học > Chương > Bài học.

- **categories**: Danh mục khóa học (Lập trình, Marketing...).
- **courses**: Thông tin tổng quan khóa học (title, description, level, thumbnail, instructor_id, status, is_private).
- **sections**: Các chương trong một khóa học.
- **lessons**: Các bài học chi tiết. Hỗ trợ 3 loại: `VIDEO`, `DOCUMENT`, `QUIZ`.
    - Chứa `video_url`, `source_url`, `hls_key`, `hls_iv` cho bảo mật video.
    - `anti_seek`: Tùy chọn chống tua.

3. Nhóm Lộ trình học tập (Learning Programs)
Nhóm các khóa học lại thành một lộ trình hoàn chỉnh.

- **learning_programs**: Thông tin lộ trình (title, description, instructor_id, status, is_private).
- **program_courses**: Bảng trung gian liên kết `LearningProgram` và `Course` với cột `order` để sắp xếp thứ tự học.
- **program_enrollments**: Lưu vết nhân sự đã tham gia lộ trình.

4. Nhóm Yêu cầu & Ghi danh (Requests & Enrollments)
Quản lý quyền truy cập nội dung riêng tư.

- **course_requests**: Yêu cầu tham gia khóa học (pending/approved/rejected).
- **program_requests**: Yêu cầu tham gia lộ trình.
- **enrollments**: Ghi danh khóa học (sau khi được duyệt).

5. Nhóm Tiến độ & Tương tác (Progress & Interaction)
- **lesson_completed**: Đánh dấu bài học đã hoàn thành.
- **reviews**: Đánh giá khóa học (1-5 sao).
- **wishlists**: Khóa học yêu thích.
- **learning_sessions**: Theo dõi thời gian học thực tế của user trên từng khóa học theo ngày (`duration`, `date`).

6. Nhóm Trắc nghiệm (Quiz)
- **quizzes**: Thông tin chung bài quiz (liên kết 1-1 với `Lesson`).
- **questions**: Nội dung câu hỏi và giải thích.
- **options**: Các lựa chọn trả lời, đánh dấu `is_correct`.
- **quiz_attempts**: Lưu vết mỗi lần làm bài (score, status: IN_PROGRESS, COMPLETED).
- **student_answers**: Lưu chi tiết câu trả lời nhân sự đã chọn trong mỗi lần làm bài.

7. Nhóm Bình luận & Thông báo (Comments & Notifications)
- **comments**: Bình luận 2 cấp (Facebook-style).
- **notifications**: Thông báo đẩy (push notifications), lưu `link` điều hướng và trạng thái `is_read`.

8. Nhóm Giao diện (UI/UX)
- **hero_banners**: Quản lý các slide banner ở trang chủ (title, description, image, button link, stat_value).

---

## ⚠️ Lưu ý về các Model "Dự kiến" (Planned)
Các model sau hiện **chưa có** trong schema chính thức nhưng có thể được phát triển thêm:
- `Orders`, `OrderItems`: Quản lý đơn hàng thương mại.
- `Payments`: Lưu vết giao dịch thanh toán.
- `Coupons`: Mã giảm giá.

---

## 💡 Một số đặc điểm kỹ thuật
1. **Soft Delete**: Sử dụng cột `deleted_at` ở các bảng quan trọng (`User`, `Course`, `LearningProgram`).
2. **Video Security**: Lưu trữ trực tiếp Binary Key (`hls_key`) trong DB thay vì file vật lý để tối đa hóa bảo mật.
3. **Tracking**: `LearningSession` tự động tổng hợp thời gian học mỗi khi user xem video hoặc tương tác với bài học.


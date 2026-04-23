1. Nhóm quản lý Người dùng (Users & Roles)
Đây là nền tảng để phân quyền giữa Học viên (Student), Giảng viên (Instructor) và Admin.

users: Lưu thông tin cơ bản (id, email, password, full_name, avatar, bio).

roles: Lưu các loại quyền (Admin, Instructor, Student).

user_roles: Bảng trung gian kết nối users và roles (quan hệ n-n).

2. Nhóm nội dung Khóa học (Courses & Content)
Đây là phần phức tạp nhất, cần cấu trúc theo phân cấp: Khóa học > Chương > Bài học.

categories: Danh mục khóa học (Lập trình, Marketing, Ngoại ngữ...).

courses: Thông tin tổng quan khóa học (tiêu đề, mô tả, giá tiền, mức độ, thumbnail, instructor_id).

sections: Các chương trong một khóa học (ví dụ: Chương 1: Căn bản).

lessons: Các bài học chi tiết (video URL ẩn, HLS, nội dung văn bản Markdown, tệp đính kèm PDF, thời lượng, thứ tự bài học).

3. Nhóm bán hàng & Thanh toán (Orders & Payments)
Phần này đảm bảo việc kinh doanh diễn ra trơn tru và bảo mật.

orders: Thông tin đơn hàng (user_id, total_price, status: pending/completed/cancelled).

order_items: Chi tiết các khóa học trong đơn hàng đó (nếu người dùng mua nhiều khóa cùng lúc).

payments: Lưu vết giao dịch (mã giao dịch từ Stripe/PayPal/Momo, phương thức thanh toán, thời gian).

coupons: Mã giảm giá (code, discount_percent, expiry_date).

course_requests / program_requests: Quản lý yêu cầu tham gia nội dung riêng tư (pending/approved/rejected).

4. Nhóm Tiến độ học tập & Tương tác (Learning Progress & Interaction)
Theo dõi xem học viên đã học đến đâu và họ đánh giá khóa học thế nào.

enrollments: Bảng ghi danh (kết nối user_id và course_id). Chỉ khi có bản ghi ở đây, học viên mới được xem nội dung.

lesson_completed: Đánh dấu bài học nào đã hoàn thành để tính % tiến độ.

reviews: Đánh giá khóa học (rating 1-5 sao, bình luận).

wishlists: Khóa học yêu thích mà người dùng lưu lại.

5. Nhóm Bình luận & Thông báo (Comments & Notifications)
Hệ thống tương tác xã hội giữa học viên.

comments: Bình luận theo bài học. Cấu trúc Facebook-style 2 cấp:
- `lesson_id`: Liên kết tới bài học.
- `user_id`: Người bình luận.
- `parent_id` (nullable): Nếu null = bình luận gốc (Level 1), nếu có giá trị = phản hồi (Level 2).
- Quan hệ tự tham chiếu (self-relation): `parent` / `replies` qua relation `CommentReplies`.
- Backend tự động gộp reply sâu hơn cấp 2 về cấp 1 (giống Facebook).

notifications: Thông báo cho người dùng:
- `user_id`: Người nhận thông báo.
- `title`, `message`: Nội dung thông báo.
- `type`: Loại thông báo (VD: `COURSE_APPROVAL`, `COMMENT_REPLY`).
- `link` (nullable): URL điều hướng khi click (VD: `/course/2/learning?lessonId=5#comment-42`).
- `is_read`: Trạng thái đã đọc.
- Phát realtime qua Socket.io event `newNotification`.

6. Nhóm bảng nội dung (Lưu đề bài)
quizzes: Quản lý thông tin chung của bài trắc nghiệm.
- id: Primary Key.
- section_id: Foreign Key (nối với bảng sections hiện có của bạn).
- title: Tên bài quiz.
- description: Mô tả.
- pass_score: Điểm để qua môn (ví dụ: 80/100).
- time_limit: Thời gian làm bài (giây).

questions: Lưu các câu hỏi.
- id: Primary Key.
- quiz_id: Foreign Key (nối với bảng quizzes).
- content: Nội dung câu hỏi.
- image_url: Hình ảnh minh họa (nếu có).
- explanation: Giải thích đáp án sau khi làm xong.

options: Các lựa chọn trả lời (A, B, C, D).
- id: Primary Key.
- question_id: Foreign Key (nối với bảng questions).
- content: Nội dung câu trả lời.
- is_correct: Kiểu Boolean (đúng hay sai).

7. Nhóm bảng kết quả (Lưu vết học viên)
quiz_attempts: Lưu mỗi lần học viên thực hiện bài test.
- id: Primary Key.
- user_id: Foreign Key (nối với bảng users).
- quiz_id: Foreign Key.
- score: Điểm đạt được.
- status: Trạng thái (đang làm, đã nộp, đạt, không đạt).
- started_at / completed_at: Thời gian bắt đầu và kết thúc.

student_answers (Tùy chọn nhưng nên có): Nếu bạn muốn học viên xem lại họ đã chọn sai câu nào.
- id: Primary Key.
- attempt_id: Foreign Key (nối với bảng quiz_attempts).
- question_id: Foreign Key.
- option_id: ID câu trả lời mà học viên đã chọn.

Một số lưu ý "chuẩn chỉ" khi thiết kế:
1. Soft Delete: Không nên xóa cứng (Hard Delete) dữ liệu. Hãy dùng cột deleted_at để có thể khôi phục khi cần.

2. Trạng thái (Status): Các cột như status nên dùng kiểu dữ liệu ENUM hoặc TINYINT để tối ưu hiệu suất (ví dụ: 0: Draft, 1: Published).

3. Lưu trữ Video: Dự án hỗ trợ cơ chế đa nguồn (Multi-source). 
- **HLS**: Video upload lên -> Băm thành định dạng HLS (.m3u8 và nhiều đoạn .ts nhỏ) có mã hóa AES-128 -> Lưu path HLS vào database. Đây là phương thức bảo mật cao nhất, hỗ trợ chặn tua và bảo vệ bản quyền.
- **YouTube/External**: Hệ thống hỗ trợ nhúng video từ YouTube hoặc link trực tiếp (.mp4). Player tự động nhận diện và áp dụng cơ chế tracking phù hợp.
- **Tiến độ (Tracking)**: Hệ thống theo dõi thời gian thực. Khi học viên xem đạt **99%** thời lượng, bài học sẽ tự động được đánh dấu hoàn thành để mở bài tiếp theo.

4. Tính toàn vẹn: Sử dụng Foreign Keys (Khóa ngoại) để đảm bảo không có bài học nào "mồ côi" không thuộc về khóa học nào.

5. Self-relation (Comment): Sử dụng quan hệ tự tham chiếu với `onDelete: Cascade` để khi xóa bình luận cha, tất cả reply con cũng bị xóa theo.

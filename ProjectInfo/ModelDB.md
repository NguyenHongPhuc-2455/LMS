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


Một số lưu ý "chuẩn chỉ" khi thiết kế:
1. Soft Delete: Không nên xóa cứng (Hard Delete) dữ liệu. Hãy dùng cột deleted_at để có thể khôi phục khi cần.

2. Trạng thái (Status): Các cột như status nên dùng kiểu dữ liệu ENUM hoặc TINYINT để tối ưu hiệu suất (ví dụ: 0: Draft, 1: Published).

3. Lưu trữ Video: Tuyệt đối không lưu file video trực tiếp vào database. Hãy lưu URL/ID của video từ các dịch vụ như AWS S3, Vimeo hoặc Cloudinary.

4. Tính toàn vẹn: Sử dụng Foreign Keys (Khóa ngoại) để đảm bảo không có bài học nào "mồ côi" không thuộc về khóa học nào.

5. Self-relation (Comment): Sử dụng quan hệ tự tham chiếu với `onDelete: Cascade` để khi xóa bình luận cha, tất cả reply con cũng bị xóa theo.

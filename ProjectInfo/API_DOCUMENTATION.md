# Tài liệu API (API Documentation)

Hệ thống sử dụng RESTful API với định dạng dữ liệu trả về mặc định là **JSON**.

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Sử dụng Bearer Token (`Authorization: Bearer <accessToken>`).
- **Token Strategy**: 
    - `accessToken`: Hết hạn sau 15 phút. Dùng để truy cập tài nguyên.
    - `refreshToken`: Hết hạn sau 7 ngày. Dùng để lấy `accessToken` mới khi hết hạn.
- **Rate Limiting**: 
    - Toàn hệ thống: Tối đa 100 req / 15 phút / IP.
    - Auth (Login/Register): Tối đa 20 req / 1 giờ / IP.

---

## 🔐 1. Authentication (`/auth`)

| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Đăng ký tài khoản | `{ username, email, password }` |
| POST | `/login` | Đăng nhập hệ thống | `{ email, password }` |
| POST | `/refresh-token` | Lấy Access Token mới bằng Refresh Token | `{ refreshToken }` |
| POST | `/logout` | Đăng xuất (xóa Refresh Token khỏi DB) | `{ refreshToken }` |

---

## 📚 2. Courses (`/courses`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/` | Lấy danh sách khóa học | ✅ |
| GET | `/:id` | Chi tiết khóa học (kèm bài học) | ✅ |
| POST | `/` | Tạo khóa học mới | ✅ |
| PUT | `/:id` | Cập nhật thông tin khóa học | ✅ |
| POST | `/sections` | Tạo chương học mới | ✅ |
| GET | `/sections/:id` | Chi tiết chương (kèm bài học) | ✅ |
| PUT | `/sections/:id` | Sửa tiêu đề/thứ tự chương | ✅ |
| DELETE | `/sections/:id` | Xóa chương học | ✅ |
| DELETE | `/:id` | Xóa khóa học | ✅ |

---

## 🎬 3. Videos & Lessons (`/videos`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/upload` | Upload & Tối ưu video HLS | ✅ (Multer: video) |
| PUT | `/:id` | Cập nhật Metadata bài học | ✅ |
| POST | `/upload-attachment/:lessonId` | Upload tài liệu đính kèm (PDF) | ✅ (Multer) |
| GET | `/key/:lessonId` | Lấy Key giải mã AES-128 | ✅ |
| POST | `/complete/:id` | Đánh dấu hoàn thành bài học | ✅ |
| DELETE | `/:id` | Xóa video & Dọn dẹp HLS Folder | ✅ |

---

## 📝 4. Quizzes (`/quizzes`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/` | Tạo bộ câu hỏi trắc nghiệm mới | ✅ |
| GET | `/lesson/:lessonId` | Lấy Quiz theo ID bài học | ✅ |
| POST | `/:id/submit` | Nộp bài làm trắc nghiệm | ✅ |
| GET | `/:id/attempts` | Lấy lịch sử làm bài của user | ✅ |
| PUT | `/:id` | Cập nhật nội dung Quiz | ✅ |
| DELETE | `/:id` | Xóa Quiz | ✅ |

---

## 🎓 5. Learning Paths/Programs (`/programs`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/` | Danh sách các lộ trình học tập | ✅ |
| GET | `/my-programs` | Lộ trình đang tham gia | ✅ |
| GET | `/:id` | Chi tiết lộ trình & các khóa học bên trong | ✅ |
| POST | `/` | Tạo lộ trình mới | ✅ |
| PUT | `/:id` | Cập nhật lộ trình | ✅ |
| DELETE | `/:id` | Xóa lộ trình (Admin) | ✅ (Admin) |
| POST | `/:id/courses` | Thêm khóa học vào lộ trình | ✅ (Admin) |
| DELETE | `/:id/courses/:courseId` | Xóa khóa học khỏi lộ trình | ✅ (Admin) |
| POST | `/:id/enroll` | Đăng ký trực tiếp (nếu lộ trình công khai) | ✅ |

---

## ✉️ 6. Access Requests (`/course-requests`, `/program-requests`)

Hệ thống hỗ trợ gửi yêu cầu truy cập cho cả Khóa học và Lộ trình riêng tư (Private).

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/course-requests` | Gửi yêu cầu vào khóa học | ✅ |
| POST | `/program-requests/request` | Gửi yêu cầu vào lộ trình | ✅ |
| GET | `/*/pending` | Xem các yêu cầu đang chờ (Admin) | ✅ (Admin) |
| POST | `/*/approve-bulk` | Duyệt hàng loạt yêu cầu | ✅ (Admin) |
| PATCH/POST | `/*/approve` | Duyệt một yêu cầu cụ thể | ✅ (Admin) |

---

## 👥 7. Users & Management (`/users`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/me` | Thông tin tài khoản hiện tại | ✅ |
| GET | `/` | Danh sách thành viên (Admin) | ✅ (Admin) |

---

## 📈 8. Statistics (`/stats`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard` | Tổng quan số liệu hệ thống (Users, Courses, Revenue...) | ✅ (Admin) |

---

## 💳 9. Payments (`/payments`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Khởi tạo đơn hàng thanh toán | ✅ |
| GET | `/my-orders` | Xem lịch sử mua hàng | ✅ |

---

## 💬 10. Comments (`/comments`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/lesson/:lessonId` | Lấy danh sách bình luận theo bài học (dạng cây 2 cấp) | ✅ |
| POST | `/` | Tạo bình luận mới (hỗ trợ parent_id cho reply) | ✅ |
| DELETE | `/:id` | Xóa bình luận (chủ sở hữu hoặc Admin) | ✅ |

> **Lưu ý**: Khi reply vào bình luận cấp 2, backend tự động gộp `parent_id` về cấp 1 (Facebook-style). Đồng thời tự động tạo thông báo Realtime cho chủ bình luận cha.

---

## 🔔 11. Notifications (`/notifications`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/` | Lấy danh sách thông báo của user (tối đa 50) | ✅ |
| PUT | `/:id/read` | Đánh dấu đã đọc | ✅ |
| PUT | `/read-all` | Đánh dấu tất cả đã đọc | ✅ |
| DELETE | `/:id` | Xóa một thông báo | ✅ |
| DELETE | `/all` | Xóa tất cả thông báo | ✅ |

> **Realtime**: Thông báo mới được phát qua Socket.io event `newNotification`. Mỗi thông báo COMMENT_REPLY có trường `link` chứa URL điều hướng tới bình luận cụ thể.

---

## ⚠️ Quy định chung về mã phản hồi (Status Codes)

- `200 OK`: Thành công.
- `201 Created`: Tạo mới thành công.
- `202 Accepted`: Yêu cầu đã nhận (Đang xử lý ngầm, VD: Upload Video).
- `400 Bad Request`: Dữ liệu không hợp lệ.
- `401 Unauthorized`: Token sai hoặc hết hạn.
- `403 Forbidden`: Không có quyền truy cập.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `429 Too Many Requests`: Vượt quá giới hạn Rate Limit.
- `500 Server Error`: Lỗi hệ thống.

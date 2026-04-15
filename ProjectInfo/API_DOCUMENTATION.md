# Tài liệu API (API Documentation)

Hệ thống sử dụng RESTful API với định dạng dữ liệu trả về mặc định là **JSON**.

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Sử dụng Bearer Token (`Authorization: Bearer <token>`) cho các Endpoint yêu cầu đăng nhập.

---

## 🔐 1. Authentication (`/auth`)

| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Đăng ký tài khoản | `{ username, email, password }` |
| POST | `/login` | Đăng nhập hệ thống | `{ email, password }` |

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

## 👥 4. Users & Management (`/users`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/me` | Thông tin tài khoản hiện tại | ✅ |
| GET | `/` | Danh sách thành viên (Admin) | ✅ (Admin) |

---

## 💳 5. Payments (`/payments`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Khởi tạo đơn hàng thanh toán | ✅ |
| GET | `/my-orders` | Xem lịch sử mua hàng | ✅ |

---

## 💬 6. Comments (`/comments`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/lesson/:lessonId` | Lấy danh sách bình luận theo bài học (dạng cây 2 cấp) | ✅ |
| POST | `/` | Tạo bình luận mới (hỗ trợ parent_id cho reply) | ✅ |
| DELETE | `/:id` | Xóa bình luận (chủ sở hữu hoặc Admin) | ✅ |

> **Lưu ý**: Khi reply vào bình luận cấp 2, backend tự động gộp `parent_id` về cấp 1 (Facebook-style). Đồng thời tự động tạo thông báo Realtime cho chủ bình luận cha.

---

## 🔔 7. Notifications (`/notifications`)

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
- `500 Server Error`: Lỗi hệ thống.

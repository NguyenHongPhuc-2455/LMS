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
| PUT | `/sections/:id` | Sửa tiêu đề/thứ tự chương | ✅ |
| DELETE | `/sections/:id` | Xóa chương học | ✅ |
| DELETE | `/:id` | Xóa khóa học | ✅ |

---

## 🎬 3. Videos & Lessons (`/videos`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/upload` | Upload & Tối ưu video HLS | ✅ (Multer: video) |
| PUT | `/:id` | Cập nhật Metadata bài học | ✅ |
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

## ⚠️ Quy định chung về mã phản hồi (Status Codes)

- `200 OK`: Thành công.
- `201 Created`: Tạo mới thành công.
- `202 Accepted`: Yêu cầu đã nhận (Đang xử lý ngầm, VD: Upload Video).
- `400 Bad Request`: Dữ liệu không hợp lệ.
- `401 Unauthorized`: Token sai hoặc hết hạn.
- `403 Forbidden`: Không có quyền truy cập.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `500 Server Error`: Lỗi hệ thống.

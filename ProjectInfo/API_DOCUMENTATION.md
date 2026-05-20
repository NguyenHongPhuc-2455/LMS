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
| GET | `/` | Lấy danh sách khóa học (Hỗ trợ lọc `?search=` và `?categoryId=`) | ✅ |
| GET | `/:id` | Chi tiết khóa học (kèm bài học) | ✅ |
| POST | `/` | Tạo khóa học mới | ✅ |
| PUT | `/:id` | Cập nhật thông tin khóa học | ✅ |
| POST | `/sections` | Tạo chương học mới | ✅ |
| GET | `/sections/:id` | Chi tiết chương (kèm bài học) | ✅ |
| PUT | `/sections/:id` | Sửa tiêu đề/thứ tự chương | ✅ |
| DELETE | `/sections/:id` | Xóa chương học | ✅ |
| DELETE | `/:id` | Xóa khóa học | ✅ |
| GET | `/mandatory` | Lấy danh sách khóa học bắt buộc của tôi | ✅ |
| GET | `/mandatory-overdue-report` | Báo cáo khóa học bắt buộc quá hạn (Admin) | ✅ (Admin) |

---

## 📂 2.1 Categories (`/categories`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/` | Lấy toàn bộ danh sách danh mục | ✅ |
| GET | `/:id` | Chi tiết danh mục | ✅ |
| POST | `/` | Tạo danh mục mới (Admin) | ✅ (Admin) |
| PUT | `/:id` | Cập nhật danh mục (Admin) | ✅ (Admin) |
| DELETE | `/:id` | Xóa danh mục (Admin) | ✅ (Admin) |

---

## 🎬 3. Videos & Lessons (`/videos`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/upload` | Upload & Tối ưu video HLS | ✅ (Multer: video) |
| PUT | `/:id` | Cập nhật Metadata bài học | ✅ |
| POST | `/upload-attachment/:lessonId` | Upload tài liệu đính kèm (PDF) | ✅ (Multer) |
| GET | `/key/:lessonId` | Lấy Key giải mã AES-128 | ✅ |
| GET | `/stream/:token/:filePath*` | Proxy Stream an toàn (Bảo mật đường dẫn vật lý, Token giới hạn IP và thời gian) | 🔐 (IP Binding) |
| POST | `/complete/:id` | Đánh dấu hoàn thành bài học (Yêu cầu đã đăng ký khóa học) | ✅ |
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
| POST | `/` | Tạo lộ trình mới (body: `title`, `description`, `thumbnail`, `level`, `status`, `is_private`, `is_mandatory`, `apply_scope`, `mandatory_targets`, `mandatory_deadline_days`, `mandatory_start_date`, `mandatory_end_date`, `allow_early_access`) | ✅ |
| PUT | `/:id` | Cập nhật lộ trình (body: Tương tự POST. Backend tự động so khớp và chặn nếu thời hạn Lộ trình học ngắn hơn thời hạn hoàn thành của bất kỳ khóa học con nào thuộc lộ trình) | ✅ |
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
| GET | `/profile` | Thông tin tài khoản hiện tại | ✅ |
| PUT | `/profile` | Cập nhật hồ sơ (Họ tên, Email, Phone, DOB, Gender, Avatar, Mã nhân sự, Phòng ban, Vị trí, Ngày vào làm) | ✅ |
| GET | `/` | Danh sách thành viên (Admin) | ✅ (Admin) |
| POST | `/` | Tạo mới người dùng (Admin) | ✅ (Admin) |
| PUT | `/:id` | Cập nhật thông tin người dùng (Admin) | ✅ (Admin) |
| DELETE | `/:id` | Xóa tài khoản (Admin - Soft Delete) | ✅ (Admin) |
| DELETE | `/batch` | Xóa hàng loạt người dùng (Admin) | ✅ (Admin) |
| POST | `/batch-update` | Cập nhật hàng loạt (Admin) | ✅ (Admin) |
| POST | `/revoke-course` | Thu hồi quyền truy cập khóa học | ✅ (Admin) |

---

## 📈 8. Statistics & Learning Tracking (`/stats`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard` | Tổng quan số liệu hệ thống (Admin) | ✅ (Admin) |
| GET | `/course-progress/:courseId` | Tiến độ toàn bộ nhân sự của khóa học | ✅ (Admin) |
| GET | `/my-learning-time?days=N` | Biểu đồ thời gian học gần đây | ✅ |
| GET | `/my-learning-summary` | Tổng kết giờ học, Streak, Peak Day | ✅ |
| GET | `/top-learners` | Bảng xếp hạng nhân sự chăm chỉ | ✅ |

---

## 🖼️ 9. Hero Banners (`/hero-banners`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/` | Lấy danh sách banner đang hoạt động | 🔓 |
| GET | `/admin` | Danh sách banner đầy đủ (Admin) | ✅ (Admin) |
| POST | `/` | Tạo banner mới | ✅ (Admin) |
| PUT | `/:id` | Cập nhật banner | ✅ (Admin) |
| DELETE | `/:id` | Xóa banner | ✅ (Admin) |

---

## 💳 10. Payments (`/payments`) - [PLANNED]

*Lưu ý: Module này hiện đang trong quá trình phát triển.*

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| POST | `/create` | Khởi tạo đơn hàng thanh toán | ✅ |
| GET | `/my-orders` | Xem lịch sử mua hàng | ✅ |

---

## 💬 11. Comments (`/comments`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/lesson/:lessonId` | Lấy danh sách bình luận theo bài học (dạng cây 2 cấp) | ✅ |
| POST | `/` | Tạo bình luận mới (hỗ trợ parent_id cho reply) | ✅ |
| DELETE | `/:id` | Xóa bình luận (chủ sở hữu hoặc Admin) | ✅ |

> **Lưu ý**: Khi reply vào bình luận cấp 2, backend tự động gộp `parent_id` về cấp 1 (Facebook-style). Đồng thời tự động tạo thông báo Realtime cho chủ bình luận cha.

---

## 🔔 12. Notifications (`/notifications`)

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/` | Lấy danh sách thông báo của user | ✅ |
| PUT | `/:id/read` | Đánh dấu đã đọc | ✅ |
| PUT | `/read-all` | Đánh dấu tất cả đã đọc | ✅ |
| DELETE | `/:id` | Xóa một thông báo | ✅ |
| DELETE | `/all` | Xóa tất cả thông báo | ✅ |

> **Realtime**: Thông báo mới được phát qua Socket.io event `newNotification`. Mỗi thông báo COMMENT_REPLY có trường `link` chứa URL điều hướng tới bình luận cụ thể.

---
 
## 💼 13. Manager Subsystem (`/manager`)

Các API này yêu cầu xác thực và chỉ cho phép người dùng có quyền quản lý phòng ban (`manager`) hoặc quản trị viên (`admin`) truy cập.

| Method | Endpoint | Description | Auth? |
| :--- | :--- | :--- | :--- |
| GET | `/employees` | Lấy danh sách nhân viên thuộc phòng ban mình (Hỗ trợ phân trang, tìm kiếm `?search=`, lọc vị trí `?positionId=`) | ✅ (Manager/Admin) |
| GET | `/employees/:id/progress` | Chi tiết danh sách khóa học và tiến độ học tập của nhân viên cụ thể | ✅ (Manager/Admin) |
| GET | `/reports/inactive` | Báo cáo nhân viên không học tập trong N ngày qua (Mặc định `?days=7`) | ✅ (Manager/Admin) |
| POST | `/reminders` | Gửi thông báo nhắc nhở học tập thời gian thực cho nhân viên | ✅ (Manager/Admin) |

*Lưu ý: Đối với manager, toàn bộ dữ liệu trả về đều được giới hạn nghiêm ngặt chỉ trong phòng ban mà tài khoản đó quản lý.*

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

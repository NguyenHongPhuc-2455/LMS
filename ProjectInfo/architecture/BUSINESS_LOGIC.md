# 🧠 Logic Nghiệp Vụ Các Chức Năng Cốt Lõi

> Tài liệu này mô tả **chi tiết logic xử lý bên trong** của từng chức năng quan trọng trong hệ thống LMS. Mục tiêu giúp lập trình viên hiểu đúng bản chất nghiệp vụ trước khi sửa đổi hoặc mở rộng tính năng, tránh phá vỡ các luồng nghiệp vụ liên quan.

---

## 1. 🔐 Xác Thực & Phân Quyền (Auth & Authorization)

**File nguồn**: `backend/src/services/auth.service.js`, `backend/src/middlewares/auth.middleware.js`

### 1.1. Đăng ký tài khoản (`register`)

```
1. Kiểm tra username và email chưa tồn tại trong DB → throw 400 nếu trùng
2. Tự động tạo role "student" nếu chưa có trong bảng roles
3. Hash mật khẩu bằng SHA-256 (crypto.createHash)
4. Tạo User mới và gắn ngay role "student" vào user_roles (trong 1 transaction)
```

> ⚠️ **Lưu ý**: Hệ thống dùng SHA-256 để hash mật khẩu, không phải bcrypt. Không thay đổi thuật toán hash mà không migrate lại toàn bộ mật khẩu hiện có.

### 1.2. Đăng nhập (`login`)

```
1. Tìm User theo username, nếu không có hoặc password_hash không khớp → throw 401
2. [Quan trọng] Nếu join_date = null (lần đăng nhập đầu tiên):
   → Tự động set join_date = ngày hôm nay
   → Trả về isFirstLogin = true (FE dùng để hiển thị modal chào mừng)
3. Tạo cặp JWT: access_token (hết hạn ngắn) + refresh_token (hết hạn dài)
4. Gọi getMandatoryCoursesForUser() để lấy danh sách khóa học bắt buộc đang tồn đọng
5. Trả về: { accessToken, refreshToken, user, isFirstLogin, mandatoryCourses }
```

### 1.3. Các tầng phân quyền Middleware

| Middleware | Điều kiện cho phép |
|---|---|
| `verifyToken` | Token JWT hợp lệ, chưa hết hạn |
| `isAdmin` | roles chứa `admin` |
| `isAdminOrManager` | roles chứa `admin` hoặc `manager` |
| `isInstructor` | roles chứa `instructor`, `admin`, `manager`, hoặc `lecturer` |
| `isAdminOrStaffRead` | Admin/Manager: toàn quyền. Instructor: chỉ GET |
| `authorize(['role1', 'role2'])` | Linh hoạt, truyền danh sách roles cho phép |

---

## 2. 🔒 Phân Phối Khóa Học & Kiểm Soát Phạm Vi (`isUserInScope`)

**File nguồn**: `backend/src/utils/scope.js`

Đây là hàm trung tâm quyết định xem một người dùng có được **thấy và truy cập** một khóa học hoặc lộ trình hay không.

### Logic thực thi theo thứ tự ưu tiên:

```
1. Nếu isEnrolled = true → cho phép ngay lập tức (bỏ qua mọi bộ lọc bên dưới)
   ↳ Đây là quy tắc ưu tiên tối cao: đã đăng ký thì luôn được truy cập dù scope thay đổi.

2. Xác định scope từ entity.apply_scope (mặc định: 'ALL_EMPLOYEE')

3. Nếu scope bắt đầu bằng 'NEW_EMPLOYEE':
   → Tính số ngày từ join_date đến hôm nay
   → Nếu > NEW_EMPLOYEE_THRESHOLD_DAYS → từ chối

4. Kiểm tra chi tiết theo scope:
   - ALL_EMPLOYEE / NEW_EMPLOYEE → cho phép tất cả (đã qua bước 3)
   - BY_DEPARTMENT → kiểm tra userData.department_id có trong targets[]
   - BY_POSITION → kiểm tra userData.position_id có trong targets[]
   - SPECIFIC_USER → kiểm tra userData.id có trong targets[]
```

### Bảng các giá trị `apply_scope` hợp lệ:

| Giá trị | Đối tượng áp dụng |
|---|---|
| `ALL_EMPLOYEE` | Tất cả nhân viên |
| `BY_DEPARTMENT` | Theo phòng ban (targets = [deptId, ...]) |
| `BY_POSITION` | Theo chức vụ (targets = [positionId, ...]) |
| `SPECIFIC_USER` | Chỉ định đích danh (targets = [userId, ...]) |
| `NEW_EMPLOYEE` | Nhân viên mới (tính theo ngày tham gia) |
| `NEW_EMPLOYEE_BY_DEPARTMENT` | Nhân viên mới, theo phòng ban |
| `NEW_EMPLOYEE_BY_POSITION` | Nhân viên mới, theo chức vụ |

> ⚠️ **Lưu ý quan trọng**: Khi gọi `isUserInScope`, **bắt buộc phải truyền tham số thứ 3** (`isEnrolled`). Nếu bỏ qua, mặc định là `false` và học viên đang học một khóa học trong lộ trình `SPECIFIC_USER` sẽ bị chặn oan vì scope không khớp với họ.

---

## 3. ⏱️ Tính Toán Trạng Thái Khóa Học Bắt Buộc (`calculateCourseStatus`)

**File nguồn**: `backend/src/utils/courseStatus.js`

Hàm này tính toán trạng thái thời hạn và quyền truy cập cho một khóa học bắt buộc.

### Các trạng thái có thể trả về (`status`):

| Status | Ý nghĩa | Điều kiện |
|---|---|---|
| `NORMAL` | Đang trong hạn, còn nhiều ngày | remainingDays > 7 |
| `WARNING` | Sắp hết hạn | remainingDays >= 0 và <= 7 |
| `OVERDUE` | Đã quá hạn | remainingDays < 0 |
| `COMPLETED` | Đã hoàn thành | progressPercent === 100 |
| `NOT_STARTED` | Chưa đến ngày mở | Có startDate và hôm nay < startDate |

### Logic tính `deadlineDate` (ngày hạn chót):

```
Ưu tiên 1: Có mandatory_start_date & mandatory_end_date (khoảng ngày cố định)
    → deadlineDate = mandatory_end_date

Ưu tiên 2: Có join_date (tính theo ngày vào làm)
    → So sánh joinDate với ngày khóa học được đặt là bắt buộc (mandatory_at):
        - Nhân viên CŨ (vào trước mandatory_at): baseDate = enrolledAt hoặc mandatory_at
        - Nhân viên MỚI (vào sau mandatory_at): baseDate = joinDate
    → deadlineDate = baseDate + mandatory_deadline_days

Ưu tiên 3: Không xác định được → trả về deadlineDate = null, không tính hạn
```

### Logic `canAccess` (quyền truy cập):

```
Mặc định: canAccess = true
Chỉ bị đặt thành false khi:
    - Khóa học có khoảng ngày cố định (start/end date)
    - VÀ hôm nay < startDate (chưa đến ngày mở)
    - VÀ allow_early_access = false
```

---

## 4. 📚 Đăng Ký Khóa Học & Lộ Trình Học

**File nguồn**: `backend/src/services/enrollment.service.js`, `backend/src/services/program.service.js`

### 4.1. Đăng ký khóa học đơn lẻ (`enrollUserToCourse`)

```
1. Kiểm tra khóa học tồn tại
2. Nếu is_private = true → throw 400 (phải dùng luồng CourseRequest)
3. Nếu is_mandatory = true:
   → Tính calculateCourseStatus() với progressPercent = 0
   → Nếu canAccess = false → throw 403 với lý do cụ thể (chưa đến ngày mở)
4. Upsert vào bảng enrollment (bỏ qua nếu đã tồn tại)
```

### 4.2. Đăng ký lộ trình học (`enrollProgram`)

```
1. Upsert vào bảng program_enrollments
2. Tự động ghi danh (upsert) tất cả các khóa học con của lộ trình vào bảng enrollments
   → skipDuplicates: true (không bị lỗi nếu đã ghi danh)
```

> ⚠️ **Lưu ý**: Khi đăng ký lộ trình, học viên tự động được ghi danh vào TẤT CẢ khóa học con. Điều này đảm bảo họ có thể truy cập các khóa học dù scope của từng khóa là `SPECIFIC_USER` hay `BY_DEPARTMENT` khác.

### 4.3. Đánh dấu hoàn thành bài học (`markLessonAsCompleted`)

```
1. Kiểm tra lesson tồn tại
2. Nếu lesson.is_free = false VÀ không phải Admin/Owner:
   → Kiểm tra đã có enrollment trực tiếp VÀ enrollment qua lộ trình không
   → Nếu không có cả 2 → throw 403
3. Upsert vào lessonCompleted
   → Nếu đã hoàn thành trước: cập nhật completed_at = now() (ghi nhận lần học lại gần nhất)
```

---

## 5. 🔑 Khóa Học Tuần Tự Trong Lộ Trình (`Sequential Lock`)

**File nguồn**: `backend/src/services/course.service.js` (hàm `getEnrichedCourseDetail`)  
**File nguồn**: `backend/src/services/program.service.js` (hàm `getEnrichedProgramDetail`)

### Logic kiểm tra khóa tuần tự khi học viên truy cập chi tiết khóa học:

```
1. Lấy tất cả lộ trình mà học viên đang tham gia (programEnrollments)
2. Với mỗi lộ trình:
   a. Tìm vị trí (currentIndex) của khóa học hiện tại trong danh sách sortedCourses
   b. Nếu currentIndex > 0 (không phải khóa học đầu tiên):
      → Duyệt qua tất cả khóa học đứng TRƯỚC nó (index 0 → currentIndex-1)
      → Với mỗi khóa học trước: tính tổng số bài học (total) và số bài đã hoàn thành (completed)
      → isFinished = (total === 0) || (completed === total)  ← Khóa học 0 bài → coi là đã xong
      → Nếu bất kỳ khóa học nào isFinished = false → đặt isLockedByProgram = true, ghi lockReason
3. Nếu isLockedByProgram = true:
   → statusInfo.canAccess = false
   → statusInfo.reason = lockReason
   → Toàn bộ nội dung bài học và link stream bị chặn ở tầng Backend
```

> ⚠️ **Thiết kế quan trọng**: Việc chặn được thực hiện tại **Backend**, không phải Frontend. Học viên không thể bypass bằng cách gọi API trực tiếp vì nội dung sẽ bị ẩn hoàn toàn khi `canAccess = false`.

---

## 6. 🔐 Yêu Cầu Truy Cập Khóa Học Riêng Tư (`CourseRequest`)

**File nguồn**: `backend/src/services/courseRequest.service.js`

### Luồng yêu cầu (`requestAccess`):

```
1. Kiểm tra khóa học tồn tại và is_private = true
2. Kiểm tra học viên chưa có enrollment → throw 400 nếu đã có quyền
3. Kiểm tra chưa có yêu cầu PENDING → throw 400 nếu đang chờ
4. Tạo CourseRequest với status = 'PENDING'
5. Emit event 'course.request_new' → Listener tạo notification cho Admin
6. Emit Socket event để cập nhật badge đếm số yêu cầu trên màn hình Admin realtime
```

### Luồng phê duyệt (`approveRequest`) — dùng Prisma Transaction:

```
1. Kiểm tra request tồn tại và status = 'PENDING'
2. Guard Clause Manager: Nếu managerDeptId khác phòng ban của học viên → throw 403
3. [TRANSACTION - đảm bảo toàn vẹn dữ liệu]:
   a. Cập nhật courseRequest.status = 'APPROVED'
   b. Upsert enrollment (cấp quyền truy cập thực sự)
   c. Emit event → thông báo cho học viên
   d. Cập nhật badge đếm realtime cho Admin
```

> ⚠️ **Lưu ý**: `approveRequest` sử dụng `prisma.$transaction` đảm bảo nếu bước cấp enrollment thất bại, trạng thái request cũng KHÔNG được cập nhật (tránh mất đồng bộ).

---

## 7. 🎬 Xử Lý & Bảo Mật Video HLS

**File nguồn**: `backend/src/services/video.service.js`, `backend/src/controllers/video.controller.js`

### Pipeline mã hóa video (`processVideoToHLS`):

```
1. Kiểm tra lessonId không đang được xử lý (chống Race Condition bằng processingLessons Set)
2. Tạo thư mục tạm (tmpDir) với tên duy nhất theo timestamp
3. Nếu inputPath là URL → Tải về thư mục tạm trước (downloadSourceIfRemote)
4. Tạo khóa mã hóa AES-128:
   → hlsKey = 16 bytes ngẫu nhiên (crypto.randomBytes)
   → hlsIv = 16 bytes ngẫu nhiên (hex string)
   → Tạo enc.keyinfo file: chứa URL endpoint lấy key + đường dẫn key file + IV
5. Chạy FFmpeg:
   → Codec: libx264 (video) + AAC (audio)
   → Tự động scale xuống tối đa 1280px chiều rộng
   → Tạo segment .ts mỗi 10 giây
   → Mã hóa toàn bộ với AES-128 theo enc.keyinfo
6. Upload toàn bộ thư mục tạm lên Cloudflare R2 (key prefix: hls/{lessonId}/)
7. Cập nhật DB: lesson.video_url = 'hls/{lessonId}/stream.m3u8', lưu hls_key và hls_iv
8. Dọn dẹp thư mục tạm và file gốc
```

### Cơ chế bảo mật khi phát stream:

```
Mỗi request phát video phải đi qua Proxy /api/videos/stream:
1. Kiểm tra JWT stream token (khác với JWT đăng nhập, thời hạn 2 tiếng)
2. Kiểm tra IP Binding: IP trong token phải khớp với IP request hiện tại
3. Nếu request là file .key → Truy vấn DB lấy hlsKey (Binary) và trả về
4. Nếu request là .m3u8 hoặc .ts → Proxy qua Cloudflare R2 với URL đã ký
```

> ⚠️ **Khóa mã hóa (`hls_key`) được lưu dưới dạng Binary trong PostgreSQL**, không phải file trên đĩa. Đây là lớp bảo vệ quan trọng: dù kẻ tấn công có toàn quyền truy cập file system, họ vẫn không thể lấy key.

---

## 8. 🔔 Hệ Thống Thông Báo (Notification)

**File nguồn**: `backend/src/services/notification.service.js`

### Kiến trúc thông báo:

```
Có 2 cách tạo thông báo:
1. createNotification() - Đồng bộ: Tạo và CHỜ phát socket (dùng trong luồng quan trọng)
2. createNotificationAsync() - Bất đồng bộ: Đẩy vào setImmediate, không chặn response
   → Dùng khi thông báo là phụ, không ảnh hưởng đến logic chính của request
```

### Các loại thông báo tự động (`checkAndCreateCourseNotifications`):

Hàm này được gọi mỗi khi học viên mở ứng dụng (trigger từ login hoặc polling):

| Loại (`type`) | Điều kiện kích hoạt | Tần suất gửi lại |
|---|---|---|
| `COURSE_ENROLLED` | Có ghi danh mới trong 3 ngày gần đây và chưa có thông báo này | 1 lần |
| `NEW_MANDATORY_COURSE` | Có khóa học bắt buộc chưa có thông báo giao việc | 1 lần |
| `COURSE_OVERDUE` | Khóa học bắt buộc đã quá hạn | Mỗi 3 ngày |
| `COURSE_EXPIRING` | Khóa học bắt buộc còn ≤ 7 ngày | Mỗi 3 ngày |

---

## 9. 📊 Báo Cáo Nhân Sự Không Học Tập (Manager Inactive Report)

**File nguồn**: `backend/src/controllers/manager.controller.js`

### Logic xác định nhân sự "Inactive":

```
1. Lấy phòng ban của Manager đang đăng nhập (getManagerDeptId)
2. Lấy tất cả học viên (role = student) thuộc phòng ban đó, bỏ qua chính Manager
3. Với tham số days (1/7/30/90), tính startDate = now - days
4. Với mỗi học viên: tính tổng duration từ learning_sessions có date >= startDate
5. Học viên được coi là INACTIVE nếu tổng duration = 0 giây
   → Kể cả 1 giây học cũng đủ để không bị liệt vào danh sách
6. Trả về kèm thông tin: số khóa bắt buộc đang học, tổng bài đã hoàn thành, tổng phút học
```

### Cơ chế đôn đốc (`sendReminder`):

```
1. Kiểm tra học viên thuộc phòng ban của Manager (bảo vệ phạm vi dữ liệu)
2. Tạo Notification trong DB với type = 'LEARNING_REMINDER'
3. Emit Socket realtime đến tài khoản học viên ngay lập tức
```

---

## 10. 🔄 Sự Kiện Nội Bộ (Internal Events)

**File nguồn**: `backend/src/utils/events.js`, `backend/src/listeners/`

Hệ thống dùng Node.js `EventEmitter` để tách biệt nghiệp vụ phát sinh sự kiện và nghiệp vụ xử lý hậu quả của sự kiện.

### Danh sách sự kiện và hậu quả:

| Sự kiện (`event`) | Nơi emit | Xử lý trong Listener |
|---|---|---|
| `course.request_new` | courseRequest.service: requestAccess | Gửi notification cho Admin |
| `course.request_approved` | courseRequest.service: approveRequest | Gửi notification cho học viên (đã được duyệt) |
| `course.request_rejected` | courseRequest.service: rejectRequest | Gửi notification cho học viên (bị từ chối) |

> **Lý do thiết kế**: Service không cần biết "thông báo được tạo như thế nào". Service chỉ cần `emit` một sự kiện. Listener độc lập xử lý việc tạo thông báo. Điều này giúp dễ dàng thêm/bớt hành vi phụ (gửi email, ghi log) mà không sửa vào logic nghiệp vụ core.

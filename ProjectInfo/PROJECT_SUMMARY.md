# 🌟 RITAVO LMS - BẢN ĐỒ DỰ ÁN & TỔNG QUAN HỆ THỐNG

Tài liệu này tổng hợp toàn bộ thông tin dự án **RitaVo LMS (Learning Management System)** dựa trên việc phân tích chi tiết **12 file tài liệu cấu trúc** tại thư mục [ProjectInfo](file:///d:/SercurityVideo/ProjectInfo).

---

## 📝 1. Tổng Quan Dự Án (Project Overview)
**RitaVo LMS** là hệ thống quản lý học tập trực tuyến (E-Learning) chuyên nghiệp, được thiết kế dưới dạng Single Page Application (SPA), tập trung tối đa vào **Bảo mật nội dung Video (HLS)** và **Trải nghiệm người dùng cao cấp**.

*   **Mô hình**: Fullstack tách biệt (Node.js Backend & React Frontend).
*   **Mục tiêu cốt lõi**:
    1.  Chống tải lậu video học tập tuyệt đối bằng công nghệ mã hóa HLS AES-128.
    2.  Theo dõi sát sao tiến độ học tập (Precise Learning Progress Tracking).
    3.  Tương tác trực tiếp thời gian thực (Realtime interaction & Facebook-style Comments).

---

## 🛠️ 2. Công Nghệ Sử Dụng (Tech Stack)

| Lớp (Layer) | Công nghệ chính | Vai trò / Chi tiết |
| :--- | :--- | :--- |
| **Backend** | Node.js (Express) | Xây dựng API Server, xử lý Request / Response nhanh gọn. |
| **Database** | PostgreSQL & Prisma ORM | Quản lý dữ liệu quan hệ, di chuyển schema nhanh (Migrations). |
| **Media Processing** | FFmpeg | Bộ băm (Transcoder) video tự động khi upload thành HLS. |
| **Realtime** | Socket.io | Đẩy thông báo tức thời, đồng bộ hoạt động phía Client. |
| **Frontend Framework** | React (Vite) + TypeScript | Ứng dụng SPA siêu mượt, kiểm soát kiểu dữ liệu an toàn. |
| **UI Library** | Ant Design (v6) | Bộ giao diện quản trị chuyên nghiệp, đồng bộ thẩm mỹ. |
| **Style System** | CSS Modules & Vanilla CSS / SCSS | Tạo giao diện cao cấp, Glassmorphism, Red RitaVo (`#C72127`). |
| **Security** | JWT, AES-128, IP Binding | Xác thực 2 lớp (Access/Refresh Token) & bảo mật luồng video. |

---

## 📂 3. Tóm Tắt Vai Trò Của 12 File Trong [ProjectInfo](file:///d:/SercurityVideo/ProjectInfo)

Dưới đây là tóm tắt nhanh nội dung của từng file để bạn dễ dàng tra cứu:

1.  **[PROJECT_STRUCTURE.md](file:///d:/SercurityVideo/ProjectInfo/PROJECT_STRUCTURE.md)**:
    *   Bản đồ cấu trúc thư mục của dự án (BE & FE).
    *   Sơ đồ hóa 5 luồng hoạt động chính: Luồng Video Đa nguồn, Duyệt yêu cầu & Tiến độ, Bình luận Facebook-style 2 cấp, Thông báo Realtime qua Socket.io và cơ chế Error Handling (`ApiError`).
2.  **[MINDMAP.md](file:///d:/SercurityVideo/ProjectInfo/MINDMAP.md)**:
    *   Sơ đồ tư duy trực quan (vẽ bằng Mermaid) phân tích 7 khối chính: Bảo mật, Cấu trúc FE, Hệ thống Video, Quản lý nội dung, Quản trị Admin, Tiến độ học tập và Thông báo.
3.  **[tong_hop_kien_truc_va_loi_hls.md.resolved](file:///d:/SercurityVideo/ProjectInfo/tong_hop_kien_truc_va_loi_hls.md.resolved)**:
    *   "Bách khoa toàn thư" về kiến trúc bảo mật video.
    *   Tổng hợp 7 lỗi kinh điển trong quá trình Streaming HLS (Đen màn hình do pixel lẻ, lỗi cache CORS 7002, sập TCP connection, xung đột React StrictMode, treo cổng 5000 EADDRINUSE và cơ chế chống tua video bằng Delta Time).
4.  **[DEVELOPMENT_STANDARDS.md](file:///d:/SercurityVideo/ProjectInfo/DEVELOPMENT_STANDARDS.md)**:
    *   Bộ quy chuẩn viết code bắt buộc.
    *   Quy định cấu trúc **Folder-based Component** cho React, mô hình **Route -> Controller -> Service -> Model** cho Backend, quy chuẩn đặt tên và checklist review trước khi push code.
5.  **[CONTRIBUTING.md](file:///d:/SercurityVideo/ProjectInfo/CONTRIBUTING.md)**:
    *   Tài liệu hướng dẫn đóng góp code dành cho lập trình viên mới.
    *   Nhấn mạnh quy chuẩn thiết kế UI Admin (Tiêu đề nằm ngoài Card, padding 10px, khoảng cách header 20px) và quy trình Git Flow.
6.  **[ENVIRONMENT_VARIABLES.md](file:///d:/SercurityVideo/ProjectInfo/ENVIRONMENT_VARIABLES.md)**:
    *   Danh sách và ý nghĩa của toàn bộ biến môi trường ở cả Backend (`.env`) và Frontend (`.env` thông qua tiền tố `VITE_`).
    *   Các biến tích hợp Cloudinary (ảnh/avatar) và VNPay (thanh toán dự kiến).
7.  **[ModelDB.md](file:///d:/SercurityVideo/ProjectInfo/ModelDB.md)**:
    *   Mô tả chi tiết 8 nhóm bảng (Models) trong database của Prisma: Người dùng (Users & Roles), Khóa học (Courses), Lộ trình (Programs), Yêu cầu (Requests), Tiến độ (Progress), Trắc nghiệm (Quiz), Bình luận & Thông báo (Comments & Notifications), Giao diện (UI).
8.  **[SOCKET_EVENTS.md](file:///d:/SercurityVideo/ProjectInfo/SOCKET_EVENTS.md)**:
    *   Định nghĩa các sự kiện kết nối thời gian thực qua Socket.io: Đăng ký kết nối (`register`) và Phát thông báo đẩy (`newNotification`).
9.  **[FRONTEND_GUIDE.md](file:///d:/SercurityVideo/ProjectInfo/FRONTEND_GUIDE.md)**:
    *   Hướng dẫn mở rộng giao diện React.
    *   Giải thích cơ chế hoạt động của hệ thống Video Player (`VideoJsPlayer`, `ServerLinkPlayer` tích hợp Shaka và `VideoPlayer` wrapper tự động).
10. **[HERO_3D_CAROUSEL.md](file:///d:/SercurityVideo/ProjectInfo/HERO_3D_CAROUSEL.md)**:
    *   Kiến trúc toán học 3D của banner xoay 4 mặt ở trang chủ.
    *   Giải thích các thuộc tính `perspective`, `preserve-3d`, `translateZ` và cơ chế hút dừng (`Snapping`) khi vuốt kéo chuột, tự động chuyển về 2D trên thiết bị di động để tối ưu hiệu năng.
11. **[API_DOCUMENTATION.md](file:///d:/SercurityVideo/ProjectInfo/API_DOCUMENTATION.md)**:
    *   Chi tiết các API endpoints của hệ thống (Auth, Users, Courses, Sections, Lessons, Comments, Notifications, Requests, Programs, v.v.).
12. **[HLS_VIDEO_PIPELINE.md](file:///d:/SercurityVideo/ProjectInfo/HLS_VIDEO_PIPELINE.md)**:
    *   Chi tiết kỹ thuật về đường ống xử lý video HLS từ khâu upload, mã hóa AES-128, tạo key, truyền phát qua Proxy của Express có check xác thực cho đến lúc trình phát client giải mã và chạy.

---

## 🌊 4. Các Luồng Nghiệp Vụ Cốt Lõi (Core Workflows)

### 🔒 A. Hệ thống Bảo mật & Truyền phát Video HLS
*   **Mã hóa HLS**: Khi upload video `.mp4`, FFmpeg sẽ mã hóa nó thành HLS bằng thuật toán AES-128. File Key (.key) được lưu trực tiếp dưới dạng dữ liệu Binary trong Postgres thông qua Prisma, không được lưu trên đĩa cứng vật lý dưới dạng file để chống bị quét trộm.
*   **Express Video Proxy**: Các tệp tin `.ts` và `.m3u8` không bao giờ được phục vụ công khai trực tiếp. Mọi yêu cầu đều phải đi qua Proxy `/api/videos/stream` để kiểm tra JWT Token (xác thực thời hạn 2 tiếng) và cơ chế IP Binding (chỉ cho phép địa chỉ IP của người dùng đã được cấp quyền).
*   **Chống tua cưỡng chế (Anti-Seek)**: So sánh Delta Time giữa 2 lần phát sóng liên tục. Nếu phát hiện nhảy vọt quá `1.2 giây`, trình duyệt ép lùi thời gian phát về vị trí cũ và hiện cảnh báo.
*   **Chống Download**: IDM hay Cốc Cốc chỉ nhận diện được file Playlist gốc 1KB chứ không thể bắt link tải cả luồng dữ liệu RAM đang giải mã.

### 💬 B. Hệ thống bình luận 2 cấp (Facebook-style)
*   **Cấp 1 (Parent)**: Bình luận gốc.
*   **Cấp 2 (Reply)**: Tất cả các phản hồi bên dưới (kể cả reply của reply) đều tự động được Backend gộp về `parent_id` cấp 1 để giữ giao diện luôn gọn gàng, tránh thụt lề vô tận gây hỏng UI.

### 🔔 C. Hệ thống Thông báo Realtime
*   Khi có tương tác mới (Duyệt lộ trình, phản hồi bình luận...), Backend tạo một dòng Notification kèm theo trường `link` (Ví dụ: `/course/1/learning?lessonId=2#comment-15`).
*   Thông qua **Socket.io**, thông báo lập tức bay về trình duyệt dạng Toast.
*   Khi click vào thông báo, hệ thống tự động điều hướng sang bài học tương ứng, tự động cuộn màn hình (`scrollIntoView`) tìm đúng bình luận đó và **Highlight vàng** trong `2.5 giây` để người dùng dễ nhìn thấy.

### 💼 D. Phân Hệ Quản Lý Phòng Ban (Line Manager Subsystem)
*   **Bảo mật dữ liệu (Security Scoping)**: Khi người dùng thuộc nhóm Quản lý (`manager`) đăng nhập, hệ thống tự động nhận diện phòng ban của họ. Tất cả truy vấn liên quan đến Thống kê Dashboard (`stats`), Báo cáo tiến độ (`progress`), Báo cáo Onboarding hay Danh sách nhân sự đều bị ép bộ lọc bắt buộc theo `department_id` của manager đó ở tầng Controller/Service, ngăn chặn rò rỉ dữ liệu giữa các phòng ban.
*   **Quản lý nhân sự phòng ban (`/admin/manager/employees`)**:
    *   Hiển thị thông tin tổng quan, chức danh, tiến độ học tập các khóa học được phân phối của từng nhân viên cấp dưới trực thuộc.
    *   Tích hợp tính năng **Gửi nhắc nhở học tập trực tiếp**: Manager có thể gửi tin nhắc nhở tùy chỉnh trực tiếp đến nhân viên. Hệ thống tự động lưu vào DB và phát tín hiệu Realtime qua **Socket.io** (`user_{employee_id}`) để hiển thị Toast thông báo ngay lập tức trên màn hình của nhân viên.
    *   **Tái cấu trúc Bộ lọc & Tìm kiếm gọn gàng**: Thu gọn các dropdowns (Khối, Phòng ban, Tổ/Nhóm, Chức vụ) và ô tìm kiếm thành **1 hàng ngang duy nhất** tương tự giao diện Admin. Tích hợp tính năng **Debounced Search (500ms)** tự động tải lại dữ liệu khi nhập từ khóa mà không cần bấm nút "Tìm kiếm" thủ công.
    *   **Sửa lỗi API & Mở rộng Hiển thị**: Khắc phục lỗi Crash API do truy vấn liên kết `Lesson` -> `Section` -> `Course`. Mở rộng bộ lọc vai trò nhân sự trong câu truy vấn để hiển thị đầy đủ cả vai trò `student` và `Employee` / `employee` trực thuộc phân cấp phòng ban của Manager.
*   **Báo cáo nhân sự không học tập (`/admin/manager/inactive-report`)**:
    *   Bộ lọc động xác định các nhân sự "Inactive" trong vòng N ngày gần nhất (không có bất kỳ bài học nào hoàn thành, hoặc tổng thời lượng học tập `learning_sessions` bằng 0).
    *   Hỗ trợ gửi cảnh báo/nhắc nhở nhanh hàng loạt cho nhóm nhân sự chậm tiến độ này.
*   **Giao diện Sidebar thích ứng**:
    *   Menu bên trái tự động rút gọn chỉ hiển thị các tính năng được phân quyền cho Manager.
    *   Mục "Quản lý nhân sự" chỉ hiển thị duy nhất phòng ban mà manager quản lý, thay vì hiển thị tất cả các phòng ban như tài khoản Admin.
*   **Chiến lược đồng bộ Workit & Xác thực tạm thời**:
    *   Sử dụng **Mã nhân viên (Employee ID)** làm cả `username` và `password` mặc định ban đầu khi đồng bộ dữ liệu từ API Workit.
    *   Mật khẩu mặc định được băm SHA256 tương ứng mã nhân viên để đảm bảo đăng nhập tạm thời nhanh chóng và ổn định trước khi chuyển đổi sang hệ thống RitaID chính thức. Quy trình đồng bộ đảm bảo không ghi đè mật khẩu của tài khoản đã tồn tại.

### 🎯 E. Lộ Trình Bắt Buộc & Cơ Chế Phân Phối Scoping
*   **Phân phối Lộ trình học thông minh (Intelligent Scoping)**:
    *   Hỗ trợ 7 loại phạm vi áp dụng (`apply_scope`): Toàn bộ nhân viên (`ALL_EMPLOYEE`), Theo phòng ban (`BY_DEPARTMENT`), Theo vị trí (`BY_POSITION`), Nhân viên cụ thể (`SPECIFIC_USER`), Chỉ nhân viên mới (`NEW_EMPLOYEE`), NV mới theo phòng ban (`NEW_EMPLOYEE_BY_DEPARTMENT`), NV mới theo vị trí (`NEW_EMPLOYEE_BY_POSITION`).
    *   **Bộ kiểm tra phạm vi (`isUserInScope`)**: Được viết tập trung tại `backend/src/utils/scope.js`. Tự động kiểm tra điều kiện áp dụng đối với người dùng (bao gồm cả so sánh khoảng thời gian ngày gia nhập `join_date` đối với các scope nhân viên mới).
    *   Nếu một học viên không thuộc phạm vi phân phối và chưa chủ động ghi danh trước đó, API sẽ chặn quyền truy cập (`403 Forbidden`) đối với Lộ trình học/Khóa học đó.
*   **Đồng bộ & Ràng buộc thời hạn hoàn thành (Deadline Consistency Guard)**:
    *   Khi bật chế độ bắt buộc (`is_mandatory`) cho Lộ trình học, Admin/Instructor có thể định nghĩa thời hạn hoàn thành (`mandatory_deadline_days` - số ngày kể từ ngày vào làm) hoặc đặt khoảng thời gian bắt buộc cố định (`mandatory_start_date` -> `mandatory_end_date`).
    *   **Ràng buộc thời hạn (Guard Rails)**: Khi thêm khóa học thành viên vào Lộ trình bắt buộc, hoặc khi chỉnh sửa thời hạn của Lộ trình, Backend tự động đối chiếu thời hạn hoàn thành. Hệ thống sẽ quăng lỗi chặn (`400 Bad Request`) nếu phát hiện thời hạn hoàn thành của Lộ trình ngắn hơn thời hạn hoàn thành của bất kỳ khóa học con nào thuộc lộ trình đó, nhằm đảm bảo tiến trình học tập logic và nhất quán.

---

## 📐 5. Quy Chuẩn Lập Trình Cho AI & Nhà Phát Triển (Development Checklist)

Khi thực hiện bất kỳ thay đổi nào trên codebase, bạn **bắt buộc** phải tuân thủ nghiêm ngặt các quy tắc sau:

### 1. Phân chia Layer rõ ràng (DRY & KISS)
*   **Backend**: Controller siêu mỏng (không chứa business logic, chỉ validate và parse tham số). Mọi logic cốt lõi đưa vào Service.
*   **Frontend**: Không viết logic gọi API trực tiếp trong component hiển thị. Hãy viết trong `src/services/` và truyền dữ liệu qua Props.

### 2. Cấu trúc Component
*   Luôn tạo component theo mô hình **Folder-based**: `src/components/MyComponent/` chứa `MyComponent.tsx`, style và `index.ts` để export tập trung.
*   Luôn định nghĩa interface TypeScript rõ ràng, tuyệt đối không lạm dụng kiểu `any`.

### 3. Đồng bộ UI Admin
*   Div bao ngoài cùng phải có `padding: 10px`.
*   Tiêu đề trang (Title) và phụ đề (Subtitle) phải đặt ở ngoài thẻ `Card`, cách Card `20px` (`margin-bottom: 20px`).
*   Sử dụng bảng màu đỏ RitaVo chủ đạo (`#C72127`).

---

> [!NOTE]
> Tài liệu này được biên soạn tự động để làm kim chỉ nam giúp bạn nhanh chóng nắm bắt và duy trì sự ổn định của hệ thống RitaVo LMS.

# Hướng dẫn Phát triển Frontend (Frontend Guide)

Tài liệu này hướng dẫn cách phát triển và mở rộng giao diện React trong dự án.

---

## 🏗️ Kiến trúc Layout
Hệ thống sử dụng 2 Layout chính trong `src/components/Layout/`:

1. **`MainLayout`**: Dành cho giao diện nhân sự (Client).
   - Bao gồm: `AppHeader`, `AppFooter`.
   - Sidebar tự động ẩn/hiện tùy theo trang.
2. **`AdminLayout`**: Dành cho quản trị viên (Admin) và Quản lý phòng ban (Line Manager).
   - Bao gồm: `AdminSidebar`, `AdminHeader`.
   - Sử dụng thiết kế Dashboard chuẩn (DashStack style).
   - **Thích ứng động theo Vai trò (Role-Based Menu)**: `AdminSidebar` tự động kiểm tra vai trò người dùng đăng nhập. Nếu là `manager` (và không phải `admin`), menu sẽ tự động rút gọn để chỉ hiển thị các chức năng thuộc phòng ban của họ (như Tổng quan phòng ban, Quản lý tiến độ học tập, Danh sách nhân viên phòng ban, Duyệt yêu cầu, Báo cáo Onboarding và Báo cáo nhân sự không học tập).

---

## 🎬 Hệ thống Video Player
Dự án sử dụng nhiều loại Player tùy thuộc vào nguồn video:

1. **`VideoJsPlayer`**: Trình phát chuẩn sử dụng `video.js`.
2. **`ServerLinkPlayer`**: Dành cho video phát từ link trực tiếp (proxy stream) của server.
   - Tích hợp **Shaka Player** để xử lý luồng HLS mã hóa AES-128.
   - Tích hợp **Request Filter** để tự động gắn Token vào Header.
3. **`VideoPlayer` (Wrapper)**: Tự động nhận diện `video_url` để render Player phù hợp.

---

## 🛠️ Cách thêm một trang mới
1. **Tạo Component**: Tạo thư mục trang trong `src/pages/client/` hoặc `src/pages/admin/`.
2. **Định nghĩa Route**: Thêm Route vào `src/App.tsx`.
   - Nếu là trang Admin: Thêm vào nhóm `<Route path="/admin" element={<AdminLayout />}>`.
   - Nếu là trang Client: Thêm vào nhóm `<Route element={<MainLayout />}>`.
3. **Lazy Load**: Sử dụng `lazy()` để tối ưu hóa hiệu suất tải trang.

---

## 🎨 Design System & Styling
- **Màu sắc**: Sử dụng tông đỏ chủ đạo (`#C72127`) của thương hiệu RitaVo.
- **Ant Design Customization**: Cấu hình tập trung trong `ConfigProvider` tại `App.tsx`.
- **CSS**: Ưu tiên sử dụng CSS Modules hoặc Vanilla CSS (Global styles trong `src/styles/`).

---

## 📡 API Services
- Sử dụng `axios` instance được cấu hình sẵn trong `src/services/api.ts`.
- Tự động đính kèm `accessToken` vào mọi request từ localStorage.
- Tự động xử lý lỗi 401 để yêu cầu đăng nhập lại.
- **`managerService`** (tại `src/services/manager.service.ts`): Cung cấp các hàm gọi API cho phân hệ Line Manager bao gồm lấy danh sách nhân viên phòng ban, lấy tiến độ học tập chi tiết của từng nhân viên, xuất báo cáo nhân viên lười học (inactive) và gửi nhắc nhở học tập realtime.

---

## 🔄 Socket.io Integration
- Lắng nghe event `newNotification` toàn cục để hiển thị thông báo.
- Socket instance được khởi tạo một lần và dùng chung toàn hệ thống.

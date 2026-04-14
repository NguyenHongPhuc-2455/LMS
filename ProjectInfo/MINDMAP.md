# Mind Map - RitaVo LMS Project

Tài liệu này trình bày sơ đồ tư duy (Mind Map) về các thành phần và tính năng cốt lõi của hệ thống RitaVo LMS.

## 🧠 Sơ đồ tư duy hệ thống (Visualized with Mermaid)

```mermaid
mindmap
  root((RitaVo LMS))
    Bảo Mật (Security)
      JWT Authentication
      RBAC (Admin, Instructor, Student)
      HLS Encryption (AES-128)
      Secure Video Keys in DB
    Hệ Thống Video (Video Engine)
      Local FFmpeg Transcoding
      H.264 Optimization (CRF 26)
      HLS Streaming (.m3u8, .ts)
      Multer Storage / Public HLS
      Storage Cleanup (Auto Delete)
    Quản Lý Nội Dung (Content)
      Categories & Levels
      Courses (Price, Level, Instructor)
      Full CRUD (Create, Update, Delete)
      Sections (Chương học)
      Lessons (Video, Doc, Quiz)
    Học Tập & Tiến Độ (Learning)
      Enrollment (Đăng ký học)
      Lesson Completion Tracking
      Progress Dashboard
    Bán Hàng (Commerce)
      Order & OrderItems
      Payment Methods (Momo, Stripe)
      Discount Coupons
    Hạ Tầng (Infrastructure)
      Node.js Express (Backend)
      React Vite (Frontend SPA)
      Prisma ORM (PostgreSQL)
      Docker Database Container
```

---

## 🔍 Phân tích chi tiết các khối

### 1. Khối Bảo Mật (Security)
Đây là "trái tim" của dự án. Không chỉ là Login/Logout, mà còn là việc bảo vệ tài sản số (Video). 
- **Cơ chế**: Video được cắt nhỏ. Mỗi khi trình duyệt muốn xem một đoạn video, nó phải xin "chìa khóa" (Key) từ server. Server chỉ cấp khóa nếu User đã mua khóa học đó.

### 2. Khối Video Engine
Thay vì dùng các dịch vụ đắt đỏ như Bunny.net, dự án tự xây dựng bộ engine:
- **Tối ưu**: Nén video cực nhẹ (CRF 26) nhưng vẫn nét 1080p.
- **Tự động**: Tự động băm video ngay khi upload xong.

### 3. Khối Content & Learning
Cấu trúc phân cấp 4 tầng: `Category` -> `Course` -> `Section` -> `Lesson`.
- Hỗ trợ tracking tiến độ học viên (Học đến đâu, hoàn thành bài nào).

### 4. Khối SPA (Single Page Application)
Giao diện React hiện đại:
- Không load lại trang (Smooth transitions).
- Layout tập trung (`MainLayout`).
- Ant Design v6 UI mượt mà.

---

## 🎯 Mục tiêu phát triển tương lai
- [ ] Tích hợp Livestream dạy học trực tuyến.
- [ ] App Mobile (React Native) sử dụng chung Backend API.
- [ ] Hệ thống AI gợi ý khóa học dựa trên hành vi học tập.

# Security Video LMS - RitaVo Learning Management System

Dự án hệ thống quản lý học tập (LMS) tập trung vào bảo mật video, tích hợp quy trình mã hóa video HLS chuyên nghiệp và cổng thanh toán VNPay.

## 🚀 Hướng dẫn chạy dự án

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18+
- **PostgreSQL**: Khuyên dùng **pgAdmin 4** để quản lý cơ sở dữ liệu.
- **FFmpeg**: Cài đặt FFmpeg trên hệ thống để xử lý video.

---

### 2. Cài đặt Backend

1.  **Di chuyển vào thư mục backend**:
    ```bash
    cd backend
    ```
2.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```
3.  **Thiết lập biến môi trường**:
    - Mở file `.env` và cấu hình các thông số sau:
      - `DATABASE_URL`: Đường dẫn đến PostgreSQL (Ví dụ: `postgresql://postgres:user@localhost:5432/db_name?schema=public`)
4.  **Khởi tạo Database (Sử dụng pgAdmin)**:
    - Tạo một database mới trong pgAdmin.
    - Chạy lệnh migration để tạo cấu trúc bảng:
      ```bash
      npx prisma migrate dev --name init
      ```
5.  **Chạy backend**:
    ```bash
    npm run dev
    ```
    Server sẽ chạy tại: `http://localhost:5000`

---

### 3. Cài đặt Frontend

1.  **Di chuyển vào thư mục frontend**:
    ```bash
    cd frontend/securityVideo
    ```
2.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```
3.  **Chạy frontend**:
    ```bash
    npm run dev
    # Hoặc nếu ưu tiên port 5174:
    npx vite --port 5174
    ```

---

## 🛠 Tính năng nổi bật

### 1. Bảo mật Video HLS
- Video được chuyển đổi sang định dạng HLS (.m3u8).
- Hỗ trợ mã hóa AES-128 để ngăn chặn tải video lậu.
- Tự động tạo Thumbnail từ video.

### 2. Cổng thanh toán VNPay
- Tích hợp thanh toán khóa học trực tiếp qua VNPay.
- Tự động kích hoạt khóa học sau khi thanh toán thành công.
- Xử lý chữ ký bảo mật (Hash) theo chuẩn 2.1.0 mới nhất.

### 3. Quản trị Chronological
- Sắp xếp chương mục (Chapters) theo thứ tự tùy chỉnh (Order field).
- Giao diện Admin chuyên nghiệp với Ant Design 6.

---

## 📂 Công nghệ sử dụng
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL, **Rate Limiting**, **Refresh Token Strategy**.
- **Frontend**: React (Vite), TypeScript, Ant Design, **React Query (TanStack)**.
- **Xử lý Video**: FFmpeg cục bộ (AES-128 Encryption).
- **Thanh toán**: VNPay SDK.

---

## 👥 Tác giả
- Phát triển bởi Đội ngũ kỹ thuật RitaVõ Education.

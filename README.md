# Security Video LMS - RitaVo Learning Management System

Dự án hệ thống quản lý học tập (LMS) tập trung vào bảo mật video, tích hợp Bunny.net Stream và HLS transcoding.

## 🚀 Hướng dẫn chạy dự án

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18+
- **Docker**: (Tùy chọn) Để chạy nhanh cơ sở dữ liệu PostgreSQL.
- **PostgreSQL**: Nếu không dùng Docker.

---

### 2. Cài đặt Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Thiết lập biến môi trường:
   - Copy file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Cấu hình lại `DATABASE_URL` và các thông tin `BUNNY_...` nếu cần.
4. Chạy cơ sở dữ liệu (sử dụng Docker):
   ```bash
   docker-compose up -d
   ```
   *(File docker-compose.yml nằm ở thư mục gốc của dự án)*
5. Khởi tạo Prisma và Database:
   ```bash
   # Tạo các bảng trong database
   npx prisma migrate dev --name init
   
   # Gieo dữ liệu mẫu (optional)
   node seed.js
   ```
6. Chạy backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   Server sẽ chạy tại: `http://localhost:3000` (mặc định)

---

### 3. Cài đặt Frontend

1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend/sercurityVideo
   ```
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Chạy frontend:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:5173`

---

## 🛠 Công nghệ sử dụng

### Backend
- **Framework**: Node.js (Express)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Video Processing**: Fluent-ffmpeg (Local) & Bunny.net Stream (Cloud)
- **Auth**: JSON Web Token (JWT)

### Frontend
- **Framework**: React.js con Vite & TypeScript
- **UI Library**: Ant Design (v6)
- **Video Player**: Video.js, Shaka Player (hỗ trợ HLS/DASH)
- **State Management**: React Router

---

## 📂 Cấu trúc thư mục

- `/backend`: Mã nguồn server, API và cấu hình Database.
- `/frontend/sercurityVideo`: Mã nguồn giao diện người dùng.
- `docker-compose.yml`: Cấu hình Docker cho PostgreSQL.
- `ModelDB.md`: Tài liệu thiết kế cơ sở dữ liệu.

---

## 🔐 Bảo mật Video
Hệ thống sử dụng cơ chế bảo mật HLS với Tokenized URL từ Bunny.net và quản lý Key decryption để ngăn chặn việc tải lậu video trái phép.

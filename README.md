# Security Video LMS - RitaVo Learning Management System

Dự án hệ thống quản lý học tập (LMS) tập trung vào bảo mật video, tích hợp quy trình tối ưu hóa video HLS cục bộ.

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
   - Cấu hình lại `DATABASE_URL` trong file `.env`.
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
   Server sẽ chạy tại: `http://localhost:5000`

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
- **Video Processing**: Fluent-ffmpeg (Local Optimization - H.264, CRF 26)
- **Auth**: JSON Web Token (JWT)

### Frontend
- **Framework**: React.js với Vite & TypeScript
- **UI Library**: Ant Design (v6)
- **Video Player**: Video.js, Shaka Player (hỗ trợ HLS/DASH)
- **State Management**: React Router

---

## 📂 Cấu trúc thư mục (Enterprise Standard)

Dự án được tổ chức theo mô hình **Separation of Concerns (SoC)** giúp dễ bảo trì và mở rộng:

### Backend (`/backend`)
- `src/controllers/`: Tiếp nhận request, điều hướng và trả về response.
- `src/services/`: **(Gốc rễ logic)** Nơi xử lý nghiệp vụ chính (FFmpeg, Database logic).
- `src/middlewares/`: Các bộ lọc trung gian (Auth, Error Handler, Upload).
- `src/utils/`: Công cụ dùng chung (`ApiError`, `catchAsync` wrapper).
- `src/routes/`: Định nghĩa các Endpoint của hệ thống.
- `prisma/`: Schema database và các file Migrations.

### Frontend (`/frontend/sercurityVideo`)
- `src/pages/`: Các màn hình chính của ứng dụng.
- `src/components/`: Các thành phần giao diện dùng lại (Navbar, VideoPlayer).
- `src/services/`: Quản lý các lệnh gọi API tập trung.
- `src/assets/`: Hình ảnh, Icons và Styles.

---

## � Quy trình phát triển chuyên nghiệp

1.  **Centralized Error Handling**: Không dùng try-catch bừa bãi, mọi lỗi được đẩy về `error.middleware.js` để trả về JSON chuẩn.
2.  **Service Layer Pattern**: Controllers không chứa logic phức tạp, giúp Unit Test dễ dàng hơn.
3.  **HLS Optimization**: Video được băm nhỏ và mã hóa bằng AES-128 trực tiếp trên server, bảo mật đường dẫn và nội dung.


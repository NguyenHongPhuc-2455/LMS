# 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

> **Cập nhật lần cuối**: 28/05/2026

## Yêu Cầu Môi Trường (Prerequisites)

Trước khi bắt đầu, đảm bảo máy tính đã cài đặt đầy đủ các phần mềm sau:

| Phần mềm | Phiên bản tối thiểu | Mục đích |
|---|---|---|
| **Node.js** | v18.x trở lên | Chạy Backend & Frontend |
| **npm** | v9.x trở lên | Quản lý package |
| **PostgreSQL** | v14.x trở lên | Cơ sở dữ liệu chính |
| **FFmpeg** | 6.x trở lên | Xử lý & mã hóa video HLS |
| **Git** | Mới nhất | Quản lý mã nguồn |

---

## Bước 1: Clone Repository & Cài Đặt Dependencies

### 1.1. Clone dự án
```bash
git clone <repository-url>
cd SercurityVideo
```

### 1.2. Cài đặt Backend Dependencies
```bash
cd backend
npm install
```

### 1.3. Cài đặt Frontend Dependencies
```bash
cd ../frontend/securityVideo
npm install
```

---

## Bước 2: Cấu Hình Biến Môi Trường (Environment Variables)

### 2.1. Tạo file `.env` cho Backend

Sao chép file mẫu và điền thông tin thực tế:
```bash
cd backend
cp .env.example .env
```

Sau đó mở file `backend/.env` và điền đầy đủ thông tin:

```env
# ===================================
# DATABASE
# ===================================
DATABASE_URL="postgresql://postgres:<mật_khẩu_của_bạn>@localhost:5432/security_video_db?schema=public"

# ===================================
# JWT SECURITY
# ===================================
JWT_SECRET="chuỗi_bí_mật_của_bạn_tối_thiểu_32_ký_tự"

# ===================================
# CLOUDINARY (Lưu trữ ảnh thumbnail)
# ===================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ===================================
# VNPAY (Thanh toán - Sandbox)
# ===================================
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/payment/vnpay/callback
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# ===================================
# FRONTEND URL (Cho CORS Production)
# ===================================
FRONTEND_URL=http://localhost:5174
CORS_ORIGINS=http://localhost:5174,http://localhost:5175
```

> **⚠️ Lưu ý**: File `.env` đã được thêm vào `.gitignore`. **Tuyệt đối không commit file `.env`** chứa thông tin bí mật lên Git.

---

## Bước 3: Khởi Tạo & Migrate Database (Prisma)

### 3.1. Tạo Database trong PostgreSQL

Mở pgAdmin hoặc psql và tạo database:
```sql
CREATE DATABASE security_video_db;
```

### 3.2. Áp dụng Migration và cập nhật Database

Vì dự án đã có sẵn lịch sử các bản ghi migration trong thư mục `prisma/migrations`, bạn có các lựa chọn an toàn sau để cập nhật cấu trúc bảng vào database của mình:

#### 🛡️ Lệnh AN TOÀN (Không mất dữ liệu):

* **Trường hợp 1: Chạy các migration có sẵn (Khuyên dùng khi pull code mới về)**
  ```bash
  npx prisma migrate deploy
  ```
  *Tác dụng:* Chỉ chạy các file migration mới chưa được áp dụng lên DB — hoàn toàn không đụng hoặc làm mất dữ liệu cũ.

* **Trường hợp 2: Đồng bộ trực tiếp Schema lên DB (Dev nhanh)**
  ```bash
  npx prisma db push
  ```
  *Tác dụng:* Khớp trực tiếp cấu trúc từ file `schema.prisma` lên database mà không tạo file migration. An toàn nếu không có breaking changes (xóa/đổi tên cột).

* **Trường hợp 3: Chỉ cập nhật Prisma Client (Không đụng database)**
  ```bash
  npx prisma generate
  ```
  *Tác dụng:* Cập nhật code gợi ý của Prisma Client để khớp với file schema hiện tại, hoàn toàn không ảnh hưởng hay thay đổi gì tới DB.

* **Trường hợp 4: Sử dụng trong môi trường phát triển (Chỉ dùng khi dev)**
  ```bash
  npx prisma migrate dev
  ```
  *Tác dụng:* Vừa áp dụng các file migration có sẵn, vừa sinh lại client mới.
  *Lưu ý:* Nếu phát hiện sự sai lệch cấu trúc giữa database local và file migration, lệnh này có thể yêu cầu reset database (làm mất dữ liệu cũ). Hãy ưu tiên **Trường hợp 1** nếu muốn bảo toàn dữ liệu.

### 3.3. Khởi tạo dữ liệu mẫu (Seeding)

Vì dự án dùng Prisma 6 và cấu trúc dự án chạy trực tiếp file seed, bạn chạy lệnh sau tại thư mục `backend` để khởi tạo dữ liệu mẫu (vai trò, phòng ban, chức vụ, tài khoản kiểm thử):

```bash
cd backend
node scripts/seed.js
```

*(Hoặc nếu đã cấu hình `"prisma": { "seed": "node scripts/seed.js" }` trong `package.json`, bạn có thể dùng lệnh `npx prisma db seed`).*

> **💡 Lưu ý**: Nếu muốn xem cấu trúc database bằng giao diện trực quan, chạy:
> ```bash
> npx prisma studio
> ```
> Prisma Studio sẽ mở tại `http://localhost:5555`

### 3.4. Danh sách tài khoản mẫu sau khi Seed

Sau khi chạy thành công file seed, hệ thống sẽ tự động tạo sẵn các tài khoản sau để bạn đăng nhập trực tiếp trên giao diện:

| Tên đăng nhập | Mật khẩu | Họ và tên | Vai trò | Phòng ban / Chức vụ |
|---|---|---|---|---|
| `admin` | `Admin@123` | Hệ thống Quản trị | Admin (Quản trị) | Toàn quyền hệ thống |
| `manager1` | `Man@123` | Quản lý IT | Manager (Quản lý) | Công nghệ thông tin / Trưởng phòng |
| `trihuynh` | `Tri@12345` | Huỳnh Minh Trí | Student (Học viên) | Công nghệ thông tin / Thực tập sinh |
| `student1` | `Stud@123` | Nguyễn Văn A | Student (Học viên) | Công nghệ thông tin / Nhân viên |

*Lưu ý: Các mật khẩu đều được thiết kế đáp ứng đúng chuẩn validate của hệ thống (chữ hoa, chữ thường, số, ký tự đặc biệt).*

---

## Bước 4: Khởi Chạy Dự Án

### 4.1. Khởi chạy Backend

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### 4.2. Khởi chạy Frontend (Mở terminal mới)

```bash
cd frontend/securityVideo
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5174` (hoặc port tiếp theo nếu đã bị chiếm)

---

## Bước 5: Kiểm Tra Hệ Thống

Mở trình duyệt và truy cập các URL sau để kiểm tra:

| URL | Mục đích |
|---|---|
| `http://localhost:5175` | Giao diện người dùng (Client) |
| `http://localhost:5175/admin` | Bảng điều khiển Admin |
| `http://localhost:5175/login` | Trang đăng nhập |
| `http://localhost:5000/api/courses` | Kiểm tra API hoạt động |

---

## Xử Lý Lỗi Thường Gặp

### ❌ Lỗi `P1001`: Cannot reach database server
**Nguyên nhân**: PostgreSQL chưa chạy hoặc thông tin kết nối trong `DATABASE_URL` sai.
**Cách xử lý**: Kiểm tra PostgreSQL đang chạy và thông tin `host`, `port`, `username`, `password` trong `DATABASE_URL`.

### ❌ Lỗi `P3006`: Migration failed
**Nguyên nhân**: Schema không khớp với migration hiện tại.
**Cách xử lý**:
```bash
npx prisma migrate reset   # ⚠️ Xóa toàn bộ dữ liệu và chạy lại từ đầu
npx prisma migrate dev
```

### ❌ Lỗi CORS khi Frontend gọi API
**Nguyên nhân**: Port Frontend không nằm trong danh sách `allowedOrigins` của `backend/src/app.js`.
**Cách xử lý**: Thêm port Frontend vào mảng `allowedOrigins` trong file `backend/src/app.js`.

### ❌ Lỗi `UNCAUGHT EXCEPTION: CloudinaryStorage is not a constructor`
**Nguyên nhân**: Xung đột phiên bản giữa `multer@2.x` (mới) và `multer-storage-cloudinary@4.0.0` (chỉ tương thích với `multer@1.x`).

**Cách xử lý**: Dự án đã ghim sẵn `multer@1.4.5-lts.1` trong `package.json`. Nếu lockfile bị lệch, cài lại đúng phiên bản:
```bash
cd backend
npm install multer@1.4.5-lts.1
npm run dev
```

> ⚠️ **Lưu ý cho team**: Không đổi lại `"multer": "^2.x"` khi vẫn dùng `multer-storage-cloudinary@4.0.0`.

### ❌ Lỗi FFmpeg không tìm thấy
**Nguyên nhân**: FFmpeg chưa được cài đặt hoặc chưa thêm vào PATH của hệ thống.
**Cách xử lý**: Tải FFmpeg từ [ffmpeg.org](https://ffmpeg.org/download.html) và thêm vào biến môi trường PATH.

---

## Cập Nhật Schema Database (Quy Trình Làm Việc)

Khi cần thay đổi cấu trúc database (thêm bảng, thêm cột...):

1. Sửa file `backend/prisma/schema.prisma`
2. Chạy lệnh tạo migration mới:
   ```bash
   npx prisma migrate dev --name mo_ta_thay_doi
   ```
3. Commit cả file `schema.prisma` và thư mục `prisma/migrations/` lên Git
4. Thành viên khác khi pull code về chạy lệnh sau để cập nhật database an toàn:
   ```bash
   npx prisma migrate deploy
   ```
   Sau đó sinh lại Prisma Client để code nhận diện kiểu dữ liệu mới:
   ```bash
   npx prisma generate
   ```

> **⚠️ Quan trọng**: Không bao giờ sửa trực tiếp các file trong thư mục `prisma/migrations/`. Hãy luôn dùng lệnh `prisma migrate dev` để tạo migration mới.

# Cấu hình Biến môi trường (Environment Variables)

Tài liệu này liệt kê các biến môi trường cần thiết để chạy dự án ở môi trường Local và Production.

---

## 🏗️ Backend (`/backend/.env`)

| Biến | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| `PORT` | Cổng chạy server | `5000` |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL (Prisma) + Connection Pool | `postgresql://user:pass@localhost:5432/db?schema=public&connection_limit=50&pool_timeout=20` |
| `JWT_SECRET` | Khóa bí mật để ký JWT Token | `secret_quan_doi_cuc_ky_bao_mat` |
| `FRONTEND_URL` | URL chính của Frontend (dùng cho CORS) | `http://localhost:5174` |
| `CORS_ORIGINS` | Danh sách origin bổ sung, phân tách bằng dấu phẩy | `http://localhost:5174,http://localhost:5175` |
| `REDIS_HOST` | ★ Địa chỉ Redis Server (BullMQ Queue & Dashboard Cache) | `127.0.0.1` (mặc định khi chạy local) |
| `REDIS_PORT` | ★ Cổng Redis | `6379` (mặc định) |

> **💡 Ghi chú về Redis**: Redis là **tùy chọn** khi phát triển. Nếu Redis không chạy, hệ thống tự động chuyển sang luồng xử lý Video In-Memory (Fallback) và bỏ qua Dashboard Cache. Hệ thống sẽ không crash.

### ☁️ Cloudinary (Dùng cho upload ảnh/avatar)
| Biến | Ví dụ |
| :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | `dohwlmspl` |
| `CLOUDINARY_API_KEY` | `367363267476676` |
| `CLOUDINARY_API_SECRET` | `7L18jhS86ULz8K4xpGTdjxeqpjU` |

### 💳 VNPay (Cấu hình thanh toán - Dự kiến)
| Biến | Ví dụ |
| :--- | :--- |
| `VNP_TMN_CODE` | `UMW2QPVM` |
| `VNP_HASH_SECRET` | `6GCKHI6TPERTNHJD9YTVCL4AS05A6XMK` |
| `VNPAY_URL` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | `http://localhost:5000/api/payment/vnpay/callback` |

---

## 💻 Frontend (`/frontend/securityVideo/.env`)

Lưu ý: Mọi biến môi trường trong Vite phải bắt đầu bằng tiền tố `VITE_`.

| Biến | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| `VITE_API_URL` | Địa chỉ API Backend | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Địa chỉ Socket.io Server | `http://localhost:5000` |

---

## 📝 Lưu ý quan trọng
1. **Không bao giờ** commit file `.env` lên Git.
2. Sử dụng file `.env.example` để làm mẫu cho các thành viên khác trong team.
3. Khi triển khai lên Production (như Railway/Vercel), hãy thiết lập các biến này trong phần Settings/Environment Variables của nền tảng đó.
4. **`connection_limit=50&pool_timeout=20`** trong `DATABASE_URL` giúp Prisma quản lý tối đa 50 kết nối DB đồng thời - quan trọng để hỗ trợ 100+ user.

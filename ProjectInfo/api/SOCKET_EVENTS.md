# Hệ thống Socket.io (Realtime Events)

Dự án sử dụng Socket.io để xử lý các tương tác thời gian thực giữa Server và Client.

---

## 📡 Kết nối (Connection)
- **Namespace**: `/` (Default)
- **Authentication**: Hiện tại socket kết nối công khai, nhưng sẽ xác thực `userId` thông qua event `register`.

---

## ⬅️ Client Emits (Gửi lên Server)

| Event | Data | Description |
| :--- | :--- | :--- |
| `register` | `{ userId }` | Đăng ký ID người dùng với socket session để nhận thông báo cá nhân. |

---

## ➡️ Server Emits (Gửi về Client)

| Event | Data | Description |
| :--- | :--- | :--- |
| `newNotification` | `{ id, title, message, type, link, created_at }` | Gửi thông báo mới (duyệt khóa học, trả lời bình luận...) tới người dùng cụ thể. |
| `courseUpdate` | `{ courseId, status }` | (Dự kiến) Thông báo khi trạng thái khóa học thay đổi. |

---

## 🛠️ Logic xử lý phía Backend (`backend/src/utils/socket.js`)
- Sử dụng Map `userSockets` để lưu trữ `userId -> socketId`.
- Hỗ trợ gửi thông báo tới một user cụ thể qua hàm `sendNotificationToUser(userId, notification)`.
- Tự động dọn dẹp `socketId` khi user disconnect.

---

## 🖥️ Xử lý phía Frontend (`frontend/src/context/SocketContext.tsx`)
- Khởi tạo kết nối khi ứng dụng khởi chạy.
- Tự động gọi `register` ngay sau khi người dùng đăng nhập thành công.
- Cung cấp hook `useSocket` để các component khác có thể lắng nghe event.

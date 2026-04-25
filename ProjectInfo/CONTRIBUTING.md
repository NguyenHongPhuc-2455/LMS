# Quy ước lập trình & Đóng góp (CONTRIBUTING)

Tài liệu này quy định các chuẩn mực về code, cấu trúc và quy trình làm việc trong dự án RitaVo LMS.

## 📐 1. Quy ước đặt tên (Naming Convention)

### Backend (Node.js)
- **Folder & Files**: Sử dụng `kebab-case` (VD: `auth-middleware.js`, `video-service.js`).
- **Biến & Hàm**: Sử dụng `camelCase` (VD: `const userData = ...`, `function getUserDetail()`).
- **Database Tables (Prisma)**: Sử dụng `snake_case` (VD: `user_roles`, `lesson_completed`).
- **Constants**: Sử dụng `UPPER_SNAKE_CASE` (VD: `const PORT = 5000`).

### Frontend (React/TS)
- **Components**: Sử dụng `PascalCase` (VD: `Navbar.tsx`, `MainLayout.tsx`).
- **Hooks**: Luôn bắt đầu bằng `use` (VD: `useAuth.ts`).
- **Interfaces/Types**: Sử dụng `PascalCase` (VD: `interface UserData`).
- **Folder Organization**: 
   - Admin: Các trang quản trị đặt tại `src/pages/admin/`.
   - Client: Các trang người dùng đặt tại `src/pages/client/`.
 - **Admin UI Standards**:
   - Layout: Tiêu đề trang và mô tả phải nằm **NGOÀI** thẻ `Card`.
   - Spacing: Toàn bộ container sử dụng padding `10px`.
   - Spacing: Header trang (Title -> Card) sử dụng `margin-bottom: 20px`.
   - Palette: Màu chủ đạo `C72127` (RitaVo Red).

---

## 🏗 2. Cấu trúc Code (Architecture)

Mọi đóng góp phải tuân thủ mô hình **Service Layer**:
1.  **Controller**: Chỉ làm nhiệm vụ điều hướng (Parse params, gọi Service, trả Response).
2.  **Service**: Chứa logic nghiệp vụ chính (Tính toán, truy vấn phức tạp, xử lý file).
3.  **Middlewares**: Kiểm tra Logic trung gian (Auth, Validation).

---

## 🛡 3. Quản lý lỗi (Error Handling)

- Tuyệt đối **KHÔNG** dùng `try-catch` lặp đi lặp lại trong Controller.
- Thay vào đó, sử dụng wrapper `catchAsync` và ném lỗi bằng class `ApiError`.

```javascript
// Cách làm đúng
exports.getDetail = catchAsync(async (req, res) => {
  const data = await service.getData();
  if (!data) throw new ApiError(404, 'Not found');
  res.json(data);
});
```

---

## 🌿 4. Quy trình Git (Git Flow)

- **Tránh commit trực tiếp lên `main`** (trừ khi là sửa lỗi nhỏ khẩn cấp).
- **Format Commit Message**:
  - `feat: ...` (Tính năng mới)
  - `fix: ...` (Sửa lỗi)
  - `refactor: ...` (Cấu trúc lại code)
  - `docs: ...` (Cập nhật tài liệu)

---

## 🧹 5. Linting & Formatting
- Dự án ưu tiên sử dụng **Prettier** để format code.
- Luôn kiểm tra lỗi TypeScript (`npm run build`) trước khi push code lên repo.

---

## 🔌 6. Socket.io & Realtime (Quy ước)

### Backend
- File quản lý socket: `backend/src/utils/socket.js`.
- Đăng ký user vào room riêng khi connect: `socket.join(userId.toString())`.
- Emit event tới user cụ thể: `socketUtils.emitToUser(userId, 'eventName', data)`.
- Tên event: sử dụng `camelCase` (VD: `newNotification`).

### Frontend
- Socket client singleton: `frontend/src/services/socket.ts`.
- Lắng nghe event trong `useEffect` với cleanup (`socket.off()`).
- Hook chuyên biệt: `useNotifications.ts` quản lý state + socket listener.

---

## 💬 7. Comment System (Quy ước kiến trúc)

### Cấu trúc 2 cấp cố định (Facebook-style)
- **Level 1**: Bình luận gốc (`parent_id = null`).
- **Level 2**: Phản hồi (`parent_id = id của Level 1`).
- **Reply vào Level 2**: Backend tự gộp `parent_id` về Level 1.

### Notification tự động
- Khi tạo reply, `CommentService` tự gọi `notificationService.createNotification()`.
- Notification kèm trường `link` chứa URL: `/course/{courseId}/learning?lessonId={lessonId}#comment-{commentId}`.
- Frontend scroll + highlight bình luận khi navigate từ notification.

### CommentSection Component
- Mỗi bình luận có `id="comment-{id}"` cho scroll targeting.
- Render đệ quy qua `renderCommentItem(item, level)`.

---

## 🎨 8. Admin Dashboard UI Sync (Standardization)

Mọi trang Quản trị mới phải tuân thủ cấu trúc Layout thống nhất:
1. **Container Wrapper**: Div ngoài cùng có `padding: 10px`.
2. **Page Header**: Nằm ngoài Card, chứa `Title (level 4)` và `Text (secondary)`. Khoảng cách xuống Card là `20px`.
3. **Card Body**: Thẻ Card chính của trang, không nên dùng lằn ngang (divider) phân tách header trong Card.
4. **Toolbar Actions**: Thanh lọc (Filter) và nút Thêm mới (Add) đặt cùng hàng `space-between` trên đầu Card.

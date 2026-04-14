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

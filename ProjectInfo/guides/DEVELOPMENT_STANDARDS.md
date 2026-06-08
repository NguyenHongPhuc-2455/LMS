# Quy chuẩn Phát triển (Development Standards)

Tài liệu này quy định các bước và quy tắc bắt buộc khi tạo mới một thành phần (Component), dịch vụ (Service) hoặc tính năng để đảm bảo tính đồng nhất, tránh xung đột code và các lỗi vặt.

---

## 🏗️ 1. Khi tạo Component mới (Frontend)

Mọi component mới phải tuân thủ cấu trúc **Folder-based Component**:

### Cấu trúc thư mục:
```text
src/components/MyComponent/
├── MyComponent.tsx       # Logic và Giao diện chính
├── MyComponent.css       # Style riêng (nếu cần)
├── index.ts               # Barrel export: export * from './MyComponent'
```

### Quy tắc viết Code:
1. **Props Interface**: Luôn định nghĩa Interface cho Props ở đầu file.
2. **Modular Style**: Ưu tiên sử dụng CSS Modules hoặc styled-components (nếu dự án có sẵn) để tránh ghi đè Style toàn cục.
3. **Exports**: Luôn sử dụng **Named Export** (ví dụ: `export const MyComponent = ...`) thay vì Default Export để tránh lỗi import sai tên và hỗ trợ tốt hơn cho việc Refactor code/IDE gợi ý.
4. **Pure Component**: Nếu component chỉ hiển thị dữ liệu, đừng đưa Logic gọi API vào trong. Hãy nhận dữ liệu qua Props.
5. **Tránh "Any"**: Tuyệt đối không dùng kiểu `any` trong TypeScript. Hãy định nghĩa Interface cụ thể.

---

## 🛠️ 2. Khi tạo Service mới (Frontend)

### Quy tắc:
1. **File định nghĩa**: Đặt tại `src/services/`.
2. **Kiểu dữ liệu**: Mỗi API call nên có Interface cho tham số truyền vào và dữ liệu trả về.
3. **Axios Instance**: Luôn sử dụng instance `api.ts` chung để được tự động đính kèm Token và xử lý lỗi 401.

```typescript
// Ví dụ chuẩn
export const courseService = {
  getDetail: async (id: number): Promise<CourseDetail> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  }
};
```

---

## 🚀 3. Khi tạo Logic Backend mới (Controller & Service)

Mô hình bắt buộc: **Route -> Controller -> Service -> Model (Prisma)**.

### Controller:
- **Nhiệm vụ**: Chỉ làm "lễ tân". Parse dữ liệu từ `req.body`, `req.query`.
- **Validation**: Phải validate dữ liệu đầu vào ngay tại Controller (hoặc qua Middleware).
- **Wrapper**: Luôn dùng `catchAsync` để bọc function.

### Service (Bếp trưởng):
- **Nhiệm vụ**: Chứa 100% logic nghiệp vụ.
- **Dữ liệu**: Trả về dữ liệu thô (Object/Array), không trả về HTTP Response (res.json).
- **Error Handling**: Sử dụng `throw new ApiError(code, message)` để ném lỗi chuẩn ra Controller. Tránh dùng `throw new Error()` thuần túy.
- **Database**: 
    - Luôn sử dụng **Singleton Prisma Client** từ `configs/prisma.js` để tránh lỗi "Too many connections" (Connection Pool exhaustion).
    - Luôn kiểm tra tồn tại của dữ liệu trước khi Update/Delete.
    - Sử dụng `prisma.$transaction` khi thực hiện nhiều lệnh ghi liên quan đến nhau.
    - Luôn lọc bỏ các bản ghi đã xóa (`deleted_at: null`).

### 🛠️ 4. Quy tắc Clean Code & Tối ưu hóa (Clean & DRY)

Để đảm bảo mã nguồn chuyên nghiệp, dễ bảo trì, mọi lập trình viên (bao gồm cả AI) phải tuân thủ:

1. **DRY (Don't Repeat Yourself)**: 
    - Tuyệt đối không viết lại logic giống nhau ở nhiều nơi.
    - Nếu một đoạn logic (như xử lý ngày tháng, kiểm tra quyền, format dữ liệu) được dùng > 2 lần, hãy trích xuất ra hàm **Helper** trong `utils/` hoặc viết hàm riêng trong Service.
2. **KISS (Keep It Simple, Stupid)**: Viết code dễ hiểu hơn là viết code "ngầu". Chia nhỏ các hàm lớn thành các hàm con có tên gọi mang tính mô tả.
3. **Thin Controller - Fat Service**: Controller không được chứa logic nghiệp vụ. Nếu Controller dài quá 20 dòng, đó là dấu hiệu cần refactor logic sang Service.
4. **Quản lý Tài nguyên (Resource Cleanup)**: 
    - Khi thực hiện các lệnh Xóa (Delete) trong Database, BẮT BUỘC phải kiểm tra và xóa các tài nguyên vật lý liên quan (File trên R2, Cloudinary, tệp tạm) để tránh rác dữ liệu.
5. **N+1 Query Optimization**: Sử dụng `Promise.all` và các kỹ thuật `select`, `include` thông minh của Prisma để giảm thiểu số lượng query lên Database.


---

## 🎨 5. Quy chuẩn đặt tên (Naming Convention)

Sự nhất quán trong cách đặt tên giúp code dễ đọc và tránh nhầm lẫn:

### 1. Backend:
- **File Name**: Sử dụng `camelCase` (Ví dụ: `courseService.js`, `authController.js`).
- **Function/Variable**: Sử dụng `camelCase` (Ví dụ: `getAllCourses`, `userId`).
- **Database Fields (Prisma)**: Sử dụng `snake_case` (Ví dụ: `created_at`, `deleted_at`, `full_name`).

### 2. Frontend:
- **Folder Component**: Sử dụng `PascalCase` (Ví dụ: `CoursePlayer/`).
- **File Component**: Sử dụng `PascalCase` (Ví dụ: `CoursePlayer.tsx`).
- **Hook**: Luôn bắt đầu bằng `use` + `camelCase` (Ví dụ: `useAuth`, `useLocalStorage`).
- **Constant**: Sử dụng `UPPER_SNAKE_CASE` cho các hằng số cố định (Ví dụ: `API_BASE_URL`).
- **Routing**: **BẮT BUỘC** sử dụng hằng số từ `src/constants/routes.ts` khi điều hướng (navigate) hoặc định nghĩa Route. Tuyệt đối không hard-coded chuỗi URL trực tiếp trong component.

### 3. Quy tắc đặt tên có ý nghĩa (Semantic Naming):
- Tránh đặt tên chung chung như `data`, `item`, `list`. Hãy đặt là `courseData`, `lessonItem`, `memberList`.
- Các hàm Boolean nên bắt đầu bằng `is`, `has`, `should` (Ví dụ: `isEnrolled`, `hasPermission`).

---

## 🔐 6. Quy tắc tránh Xung đột & Lỗi vặt

### Tránh xung đột (Merge Conflicts):
1. **File dùng chung**: Hạn chế sửa các file `App.tsx`, `index.css` hoặc các Component dùng chung toàn hệ thống (`AppHeader`, `AppFooter`) nếu không thực sự cần thiết.
2. **Tách biệt Logic**: Nếu bạn thêm tính năng mới, hãy tạo Folder riêng, file Route riêng thay vì nhồi nhét vào file cũ.
3. **Cài đặt Thư viện**: **TUYỆT ĐỐI KHÔNG** tự ý chạy `npm install` để thêm thư viện mới mà chưa hỏi ý kiến hoặc thảo luận với Team. AI phải đặc biệt tuân thủ quy tắc này.

### Tránh lỗi vặt (Common Bugs):
1. **Null/Undefined Check**: Luôn kiểm tra dữ liệu trước khi truy cập thuộc tính (Sử dụng Optional Chaining `data?.property`).
2. **Loading States**: Mọi thao tác gọi API phải có trạng thái Loading (`spin`, `skeleton`) để người dùng không bấm liên tục.
3. **Cleanup**: Khi dùng `useEffect` (Frontend) hoặc `Socket.io` (Backend), hãy đảm bảo có hàm dọn dẹp (cleanup/off) để tránh rò rỉ bộ nhớ.
4. **Z-Index**: Tránh dùng số `z-index` quá lớn hoặc ngẫu nhiên. Hãy tuân thủ hệ thống z-index của Ant Design.

---

## 📝 7. Quy trình Review trước khi Push
- [ ] Code đã được format bằng Prettier/ESLint.
- [ ] Không còn console.log thừa.
- [ ] TypeScript không báo lỗi (`npm run build` thành công).
- [ ] Đã kiểm tra giao diện trên cả màn hình Desktop và Mobile (Responsive).
- [ ] API mới đã được cập nhật vào `API_DOCUMENTATION.md`.

> **Yêu cầu đối với AI**: Sau khi hoàn thành code, bạn **BẮT BUỘC** phải tự chạy lại Checklist này và xác nhận trong phản hồi với người dùng.

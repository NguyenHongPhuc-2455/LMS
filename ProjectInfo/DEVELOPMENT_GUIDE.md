# 📐 Hướng Dẫn Cấu Trúc Dự Án & Quy Chuẩn Code

> Cập nhật lần cuối: 19/05/2026

> Tài liệu này là **bắt buộc phải đọc** trước khi bắt đầu đóng góp vào dự án. Mục tiêu là đảm bảo mọi thành viên đều code theo cùng một kiến trúc, tránh phá vỡ cấu trúc và gây ra nợ kỹ thuật (Technical Debt).

---

## 📁 1. Tổng Quan Cấu Trúc Thư Mục Gốc

```
SercurityVideo/
├── backend/                # Node.js + Express API Server
├── frontend/
│   └── securityVideo/      # React + Vite + TypeScript Frontend
├── ProjectInfo/            # Toàn bộ tài liệu kỹ thuật của dự án
├── docker-compose.yml      # Cấu hình Docker (optional)
└── README.md
```

---

## 🖥️ 2. Cấu Trúc Backend (`backend/`)

### 2.1. Kiến Trúc Tổng Thể

Backend tuân thủ kiến trúc **"Thin Controller, Fat Service"**:

```
backend/
├── prisma/
│   ├── schema.prisma       # ← Toàn bộ định nghĩa Model DB tại đây
│   └── migrations/         # Lịch sử thay đổi DB (do Prisma tạo tự động)
├── public/                 # Thư mục chứa file HLS (.m3u8, .ts) sau khi encode
├── src/
│   ├── app.js              # ← Entry point: Đăng ký tất cả routes & middleware
│   ├── configs/            # Cấu hình kết nối (Prisma client, v.v.)
│   ├── constants/          # Hằng số dùng chung (messages, system config)
│   ├── controllers/        # ← Tầng mỏng: Chỉ nhận request, gọi service, trả response
│   ├── listeners/          # Lắng nghe các sự kiện nội bộ (EventEmitter)
│   ├── middlewares/        # Auth, Error Handler, Rate Limiter, Validator
│   ├── routes/             # Định nghĩa đường dẫn API và gắn middleware/controller
│   ├── services/           # ← Tầng dày: Toàn bộ business logic nằm ở đây
│   ├── utils/              # Các tiện ích tái sử dụng (ApiError, catchAsync, v.v.)
│   └── validations/        # Schema kiểm tra dữ liệu đầu vào (Joi)
└── .env                    # Biến môi trường (KHÔNG commit lên Git)
```

### 2.2. Luồng Xử Lý Request (Request Lifecycle)

```
Client Request
    ↓
Route (routes/*.routes.js)
    ↓
Middleware (auth.middleware.js → validate.js)
    ↓
Controller (controllers/*.controller.js)  ← Mỏng: Chỉ gọi service
    ↓
Service (services/*.service.js)           ← Dày: Business logic & DB
    ↓
Prisma ORM → PostgreSQL
    ↓
Response JSON
```

### 2.3. Quy Tắc Bắt Buộc Khi Thêm Tính Năng Backend

#### ✅ Controller - Chỉ làm 3 việc
```javascript
// ✅ ĐÚNG: Controller mỏng - chỉ nhận, gọi, trả
exports.createCourse = catchAsync(async (req, res) => {
    const result = await courseService.createCourse(req.body, req.user.id);
    res.status(201).json(result);
});

// ❌ SAI: Không được viết business logic trong controller
exports.createCourse = catchAsync(async (req, res) => {
    // ❌ Không query DB trực tiếp trong controller
    const existing = await prisma.course.findFirst({ where: { title: req.body.title } });
    if (existing) throw new Error('...');
    // ...
});
```

#### ✅ Service - Nơi chứa toàn bộ logic
```javascript
// ✅ ĐÚNG: Service chứa logic đầy đủ
const createCourse = async (data, userId) => {
    // Validate business rules
    const existing = await prisma.course.findFirst({ where: { title: data.title } });
    if (existing) throw new ApiError(400, 'Khóa học đã tồn tại');

    // Xử lý data
    const course = await prisma.course.create({ data: { ...data, instructor_id: userId } });
    return course;
};
```

#### ✅ Luôn dùng `catchAsync` và `ApiError`
```javascript
// Không bao giờ dùng try/catch thủ công trong Controller
// Dùng catchAsync để tự động bắt lỗi và chuyển sang errorMiddleware
exports.myHandler = catchAsync(async (req, res) => { ... });

// Throw lỗi có HTTP status code rõ ràng
throw new ApiError(404, 'Không tìm thấy tài nguyên');
throw new ApiError(403, 'Bạn không có quyền');
throw new ApiError(400, 'Dữ liệu đầu vào không hợp lệ');
```

#### ✅ Thêm Route mới phải theo đúng quy trình
```
1. Tạo validation schema trong validations/<tên>.validation.js
2. Tạo service method trong services/<tên>.service.js
3. Tạo controller method trong controllers/<tên>.controller.js
4. Đăng ký route trong routes/<tên>.routes.js
5. Mount route vào app.js: app.use('/api/<tên>', <tên>Routes)
```

#### ✅ Thêm trường mới vào Database
```
1. Sửa schema.prisma (thêm trường vào model tương ứng)
2. Chạy: npx prisma migrate dev --name them_truong_<ten_truong>
3. Commit cả schema.prisma VÀ thư mục migrations/
```

### 2.4. Danh Sách Các Utils Quan Trọng

| File | Mục đích | Cách dùng |
|---|---|---|
| `utils/ApiError.js` | Tạo lỗi HTTP có status code | `throw new ApiError(404, 'message')` |
| `utils/catchAsync.js` | Bao bọc async controller, tự forward lỗi | `exports.fn = catchAsync(async (req,res) => {})` |
| `utils/scope.js` | Kiểm tra phạm vi phân phối khóa học/lộ trình | `isUserInScope(userData, entity, isEnrolled)` |
| `utils/courseStatus.js` | Tính toán trạng thái khóa học (deadline, overdue) | `calculateCourseStatus(course, userData, progress)` |
| `utils/socket.js` | Gửi thông báo real-time qua Socket.IO | `emitToUser(userId, event, data)` |
| `constants/messages.js` | Hằng số thông báo lỗi tập trung | `MESSAGES.AUTH.UNAUTHORIZED` |

---

## 🎨 3. Cấu Trúc Frontend (`frontend/securityVideo/src/`)

### 3.1. Kiến Trúc Tổng Thể

```
src/
├── App.tsx                 # ← Định nghĩa toàn bộ routes của ứng dụng
├── main.tsx                # Entry point React
├── assets/                 # Hình ảnh tĩnh, fonts
├── components/             # ← UI Components tái sử dụng toàn cục
├── constants/              # Hằng số: routes.ts, enums
├── context/                # React Context (Auth, Theme, v.v.)
├── hooks/                  # Custom Hooks tái sử dụng
├── pages/                  # ← Các trang ứng dụng
│   ├── Login/              # Trang đăng nhập
│   ├── Register/           # Trang đăng ký
│   ├── admin/              # Toàn bộ trang Admin
│   └── client/             # Toàn bộ trang học viên
├── services/               # ← Các hàm gọi API Backend
├── styles/                 # Global styles (global.scss)
└── types/                  # TypeScript type definitions tập trung
```

### 3.2. Cấu Trúc Một Trang (Page Structure)

Mỗi trang phải được đặt trong thư mục riêng và có thể có thư mục `components/` cho các component con chỉ dùng trong trang đó:

```
pages/admin/CourseManagement/
├── CourseManagement.tsx        # ← Component chính của trang
├── CourseManagement.module.scss # ← Style riêng của trang (CSS Modules)
└── components/                 # Component con chỉ dùng trong trang này
    ├── CourseTable.tsx
    ├── CourseFormModal.tsx
    └── CourseFilter.tsx
```

### 3.3. Phân Vùng Admin vs Client

| Vị trí | Layout | Guard | Mục đích |
|---|---|---|---|
| `pages/admin/*` | `AdminLayout` | `roles: ['admin', 'instructor']` | Bảng quản trị hệ thống |
| `pages/admin/manager/*` | `AdminLayout` | `roles: ['manager']` | Bảng quản lý phòng ban |
| `pages/client/*` | `MainLayout` | `roles: ['student']` hoặc public | Giao diện học viên |
| `pages/Login`, `pages/Register` | Không layout | Public | Xác thực |

### 3.4. Quy Tắc Bắt Buộc Khi Thêm Tính Năng Frontend

#### ✅ Luôn thêm Route vào App.tsx theo đúng vùng

```tsx
// Trong App.tsx, mọi route admin PHẢI nằm trong AdminLayout
<Route element={<AdminLayout />}>
    <Route path="admin/courses" element={<CourseManagement />} />
    {/* Route mới của bạn: */}
    <Route path="admin/new-feature" element={<NewFeaturePage />} />
</Route>
```

#### ✅ Luôn khai báo đường dẫn trong `constants/routes.ts`

```typescript
// ✅ ĐÚNG: Dùng constant
import { ROUTES } from '@/constants/routes';
navigate(ROUTES.ADMIN_COURSES);

// ❌ SAI: Không dùng string hardcode trong code
navigate('/admin/courses');
```

#### ✅ Mọi lời gọi API phải qua Service Layer

```typescript
// ✅ ĐÚNG: Gọi qua service
import { courseService } from '@/services/course.service';
const courses = await courseService.getAll({ page: 1 });

// ❌ SAI: Không gọi axios trực tiếp trong component
import axios from 'axios';
const courses = await axios.get('http://localhost:5000/api/courses');
```

#### ✅ Cấu trúc một Service File

```typescript
// services/myFeature.service.ts
import api from "./api"; // ← Luôn dùng instance api đã cấu hình (có JWT interceptor)
import type { MyType } from "../types/myType";

export const myFeatureService = {
    getAll: async (params?: { page: number }): Promise<MyType[]> => {
        const response = await api.get('/my-feature', { params });
        return response.data;
    },
    create: async (data: Partial<MyType>): Promise<MyType> => {
        const response = await api.post('/my-feature', data);
        return response.data;
    },
    // ...
};
```

#### ✅ Định nghĩa TypeScript Types

```typescript
// types/myFeature.ts
// Luôn tạo type riêng, không dùng `any` nếu có thể tránh được
export interface MyFeature {
    id: number;
    name: string;
    created_at: string;
}
```

### 3.5. Danh Sách Các Components Toàn Cục Quan Trọng

| Component | Vị trí | Mục đích |
|---|---|---|
| `AdminLayout` | `components/AdminLayout/` | Layout wrapper cho toàn bộ trang Admin |
| `MainLayout` | `components/MainLayout/` | Layout wrapper cho toàn bộ trang Client |
| `AppHeader` | `components/AppHeader/` | Header chung (có search bar, thông báo, profile) |
| `MandatoryCourseBanner` | `components/MandatoryCourseBanner/` | Banner nhắc nhở khóa học bắt buộc |
| `VideoJsPlayer` | `components/VideoJsPlayer/` | Player video HLS đã tích hợp bảo mật |
| `CommentSection` | `components/CommentSection/` | Section bình luận tái sử dụng |

---

## 🔌 4. Giao Tiếp Frontend ↔ Backend

### API Base URL

File `frontend/securityVideo/src/services/api.ts` đã cấu hình sẵn:
- **Development**: `http://localhost:5000/api`
- **Production**: Lấy từ biến môi trường `VITE_API_URL`

File này tự động:
- Đính kèm `Authorization: Bearer <token>` vào mỗi request
- Tự động gọi Refresh Token khi nhận lỗi `401`
- Chuyển hướng về `/login` nếu Refresh Token hết hạn

### Cấu Trúc Response Chuẩn Backend

```json
// Thành công
{ "message": "Mô tả kết quả", "data": { ... } }

// Lỗi (do errorMiddleware xử lý)
{ "message": "Mô tả lỗi", "statusCode": 400 }
```

---

## 📋 5. Quy Trình Phát Triển Tính Năng Mới (Feature Development Workflow)

```
1. TẠO BRANCH mới từ dev: git checkout -b feature/<tên-tính-năng>

2. BACKEND (nếu cần API mới):
   a. Sửa schema.prisma (nếu cần thay đổi DB)
   b. Chạy: npx prisma migrate dev --name <mô tả>
   c. Tạo/sửa: validations → service → controller → routes → app.js

3. FRONTEND:
   a. Thêm type mới vào src/types/
   b. Thêm service method vào src/services/
   c. Tạo Page/Component mới trong src/pages/
   d. Đăng ký route trong src/App.tsx
   e. Thêm constant vào src/constants/routes.ts

4. KIỂM TRA:
   a. Test chức năng trên trình duyệt
   b. Kiểm tra không làm vỡ các tính năng đã có

5. COMMIT & MR:
   a. git add . && git commit -m "feat: <mô tả ngắn gọn>"
   b. Tạo Pull Request/Merge Request về nhánh dev
```

---

## ⛔ 6. Những Điều Tuyệt Đối KHÔNG Được Làm

| ❌ KHÔNG | ✅ THAY BẰNG |
|---|---|
| Viết business logic trong Controller | Viết trong Service tương ứng |
| Gọi API trực tiếp bằng `axios` trong Component | Gọi qua `*Service` trong `src/services/` |
| Dùng string hardcode cho đường dẫn URL | Dùng `ROUTES.*` từ `constants/routes.ts` |
| ❌ Dùng string hardcode cho thông báo lỗi Backend | Dùng `MESSAGES.*` từ `constants/messages.js` |
| ❌ Sửa trực tiếp file trong `prisma/migrations/` | Luôn dùng `npx prisma migrate dev` |
| ❌ Commit file `.env` lên Git | Chỉ commit `.env.example` (không có giá trị thật) |
| ❌ Dùng `any` tràn lan trong TypeScript | Định nghĩa interface/type cụ thể trong `src/types/` |
| ❌ Tạo style bằng `style={{ }}` inline phức tạp | Dùng CSS Module (`.module.scss`) cho component |
| ❌ Query Prisma trực tiếp trong Controller | Luôn thông qua Service layer |
| ❌ Dùng `^` (caret) cho các package dễ xung đột phiên bản | Ghim chính xác phiên bản (`"1.4.5-lts.1"`) |

---

## ⚠️ 7. Lỗi Đã Biết & Cách Xử Lý (Known Issues)

### ❌ `UNCAUGHT EXCEPTION: CloudinaryStorage is not a constructor`

**Xuất hiện khi**: Chạy `npm install` trên máy mới, sau đó chạy `npm run dev`.

**Nguyên nhân**: Xung đột phiên bản giữa:
- `multer@^2.1.1` → npm kéo v2.x mới nhất
- `multer-storage-cloudinary@4.0.0` → chỉ tương thích với `multer@1.x`

**Cách khắc phục người dùng**:
```bash
cd backend
npm install multer@1.4.5-lts.1
npm run dev
```

**Khắc phục gốc rễ** (chứ dự án nên thực hiện sớm):
Sửa `backend/package.json`, đổi:
```json
"multer": "^2.1.1"
```
thành:
```json
"multer": "1.4.5-lts.1"
```
Sau đó chạy lại `npm install` và commit `package.json` + `package-lock.json` lên Git.

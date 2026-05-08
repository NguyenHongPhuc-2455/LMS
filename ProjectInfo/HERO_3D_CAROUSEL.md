# Hướng dẫn Kỹ thuật: 3D Hero Carousel Mechanism

Tài liệu này giải thích chi tiết cách xây dựng và cơ chế hoạt động của khối Carousel 3D trong phần Hero Banner của hệ thống RitaVo eLearning.

## 1. Cấu trúc Thành phần (Components)
Tính năng được chia thành 2 tệp chính:
- `HeroSection.tsx`: Chứa logic điều khiển (State), sự kiện chuột/cảm ứng.
- `HeroSection.module.scss`: Chứa các thuộc tính CSS 3D quan trọng.

## 2. Cơ chế Hình học 3D (Core Logic)

### A. Không gian 3D (3D Scene)
Để tạo ra hiệu ứng chiều sâu, chúng ta sử dụng thuộc tính `perspective` trên lớp bao ngoài (`.scene`).
- **Perspective**: 800px. Giá trị này xác định khoảng cách từ mắt người xem đến mặt phẳng z=0. Giá trị càng nhỏ, hiệu ứng biến dạng 3D càng mạnh.
- **Transform-style**: `preserve-3d`. Được áp dụng cho lớp `.carousel` để đảm bảo các phần tử con (các mặt thẻ) được render trong không gian 3D thay vì bị phẳng hóa.

### B. Hình khối 4 mặt (The Cube)
Carousel của chúng ta có 4 mặt, tạo thành một hình trụ vuông xoay quanh trục Y.
- Mỗi mặt card được xoay một góc 90 độ so với mặt trước đó: `0deg`, `90deg`, `180deg`, `270deg`.
- **TranslateZ**: Để các mặt không nằm chồng lên nhau tại tâm, chúng ta đẩy mỗi mặt ra xa tâm một khoảng bằng một nửa chiều rộng của thẻ.
  - Chiều rộng thẻ = 280px.
  - `translateZ(140px)` (trong code đang dùng 160px để tạo khoảng cách an toàn).

## 3. Cơ chế Tương tác (Interaction)

### A. Vuốt kéo (Drag & Swipe)
Hệ thống sử dụng các sự kiện `onMouseDown`, `onMouseMove`, `onMouseUp` để tính toán khoảng cách di chuyển của chuột (`diffX`).
- **Công thức xoay**: `newRotation = startRotation + (diffX * sensitivity)`.
- **Sensitivity**: Hệ số nhạy (0.3 trên Desktop, 0.5 trên Mobile) để tạo cảm giác kéo tự nhiên.

### B. Cơ chế Hút (Snapping)
Khi người dùng thả chuột, hệ thống thực hiện làm tròn góc xoay về bội số của 90:
```javascript
const snappedRotation = Math.round(rotation / 90) * 90;
```
Điều này đảm bảo khối luôn dừng lại chính xác ở một mặt thẻ, không bị lệch góc.

## 4. Tối ưu hiệu năng (Performance)

- **GPU Acceleration**: Sử dụng `will-change: transform` để báo hiệu cho trình duyệt ưu tiên xử lý qua card đồ họa.
- **Backface-visibility**: `hidden`. Giúp ẩn các mặt phía sau, giảm bớt khối lượng render cho trình duyệt.
- **Auto-rotate Pause**: Tự động dừng Timer khi `isDragging = true` để tránh xung đột giữa việc xoay tự động và việc người dùng đang kéo.

## 5. Khả năng tương thích (Responsiveness)

Hệ thống tự động phát hiện thiết bị:
- **Desktop**: Sử dụng thuộc tính xoay 3D (`rotateY`).
- **Mobile**: Chuyển sang cơ chế 2D Slider đơn giản sử dụng `translateX`.
- **Lý do**: Hiệu ứng 3D trên mobile đôi khi gây nặng máy hoặc khó tương tác chính xác với diện tích màn hình nhỏ.

---
*Tài liệu được tạo bởi Antigravity AI Assistant.*

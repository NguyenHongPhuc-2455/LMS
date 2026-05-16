# Đề xuất Giải pháp Logic Khóa học Bắt buộc (Mandatory Course Logic)

Tài liệu này trình bày hướng giải quyết cho bài toán quản lý khóa học bắt buộc với các yêu cầu đặc thù về đối tượng nhân viên cũ/mới và việc chỉ định đích danh.

## 1. Vấn đề hiện tại & Cải tiến Kiến trúc
- **Trước đây:** Tính chất "Bắt buộc" bị gộp chung với "Phạm vi áp dụng". Nếu một khóa học gửi cho phòng ban, nó mặc định bị ép là bắt buộc có hạn chót.
- **Hiện tại (Cải tiến 2 bước):** 
    - **Bước 1 (Phân phối - Distribution):** Khóa học được gán cho một tập đối tượng (Phòng ban/Vị trí/Cá nhân). Họ sẽ thấy khóa học nhưng ở dạng **Tự nguyện**.
    - **Bước 2 (Thực thi - Enforcement):** Khi Admin bật cờ `is_mandatory` (Bắt buộc), hệ thống mới bắt đầu tính Hạn chót (Deadline) và gửi nhắc nhở.

## 2. Cấu trúc dữ liệu đề xuất
Cần bổ sung bảng `CourseAssignment` (thay vì MandatoryAssignment) để theo dõi lịch sử phân phối khóa học tới từng nhân viên.

| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `user_id` | Integer | ID nhân viên |
| `course_id` | Integer | ID khóa học |
| `assigned_at` | DateTime | Thời điểm được gán (Mặc định là `now()`) |
| `source` | Enum | Nguồn gán: `SYSTEM` (Tự động theo phòng ban/vị trí) hoặc `MANUAL` (Admin chỉ định) |
| `is_mandatory`| Boolean | Kế thừa cờ bắt buộc tại thời điểm tính toán |

## 3. Phân tách Logic tính Hạn chót (Deadline)

Hệ thống sẽ tự động xác định công thức tính dựa trên thuộc tính của nhân viên tại thời điểm kiểm tra:

### A. Nhóm Nhân viên mới (Onboarding)
- **Đối tượng:** Nhân viên có `join_date` cách ngày hiện tại <= 90 ngày.
- **Công thức:** `Deadline = join_date + mandatory_deadline_days`.
- **Đặc điểm:** Hạn chót gắn liền với ngày thử việc/vào làm của nhân viên đó.

### B. Nhóm Nhân viên cũ (Legacy)
- **Đối tượng:** Nhân viên có `join_date` cách ngày hiện tại > 90 ngày (Và thuộc diện áp dụng theo Phòng ban/Vị trí/Toàn công ty).
- **Công thức:** `Deadline = Null` (Vô thời hạn).
- **Đặc điểm:** Hiển thị nhãn "Bắt buộc" nhưng không báo quá hạn, không gây áp lực thời gian dựa trên ngày vào làm từ quá khứ.

### C. Nhóm Chỉ định đích danh (Specific Assignment)
- **Đối tượng:** Nhân viên được Admin chọn thủ công trong mục "Nhân viên cụ thể".
- **Công thức:** `Deadline = assigned_at (Ngày Admin gán) + mandatory_deadline_days`.
- **Đặc điểm:** Bất kể nhân viên cũ hay mới, hễ được chỉ định riêng thì sẽ có X ngày để hoàn thành kể từ lúc nhận được lệnh.

## 4. Cơ chế vận hành Backend

1.  **Trigger tự động:** Khi Admin tạo khóa học hoặc cập nhật Phạm vi áp dụng (Scope), hệ thống sẽ quét danh sách nhân viên thỏa mãn và ghi bản ghi vào bảng `MandatoryAssignment`.
2.  **Đồng bộ nhân viên mới:** Khi một tài khoản nhân viên mới được tạo, hệ thống tự động kiểm tra các khóa học bắt buộc đang có hiệu lực để gán ngay lập tức.
3.  **Hàm tính toán tập trung:** Viết một hàm `calculateUserDeadline(userId, courseId)` duy nhất để trả về thông tin hạn chót đồng nhất cho tất cả các màn hình (Dashboard, Danh sách khóa học, Báo cáo).

## 5. Hiển thị giao diện (Frontend)
- **Trạng thái Bình thường:** Hiển thị "Còn X ngày" kèm ngày cụ thể.
- **Trạng thái Nhân viên cũ:** Hiển thị nhãn "Bắt buộc" (không kèm ngày hạn chót).
- **Trạng thái Quá hạn:** Chỉ hiển thị cho Nhóm A và Nhóm C khi vượt quá số ngày quy định.

---
*Tài liệu này phục vụ mục đích thống nhất logic trước khi triển khai code thực tế.*

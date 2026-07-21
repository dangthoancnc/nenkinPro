# TÀI LIỆU YÊU CẦU SẢN PHẨM (PRD)
**Dự án:** NenkinPro
**Giai đoạn:** Phase 1 Foundation Refactoring
**Phong cách thiết kế:** Modern Minimalist Glassmorphism

---

## 1. TỔNG QUAN (OVERVIEW)
NenkinPro đang bước vào giai đoạn tái cấu trúc nền tảng (Phase 1 Foundation Refactoring) để đáp ứng chuẩn Enterprise. Mục tiêu của giai đoạn này là tăng cường tính minh bạch của dữ liệu thông qua cơ chế AuditLog, tối ưu hóa trải nghiệm người dùng và khả năng bảo trì mã nguồn bằng cách module hóa các trang giao diện (UI), áp dụng xác thực dữ liệu nghiêm ngặt, và chuẩn hóa luồng chuyển đổi trạng thái (State Machine).

---

## 2. YÊU CẦU NGHIỆP VỤ: CƠ CHẾ AUDIT LOG (STATE TRANSITIONS)
Việc theo dõi lịch sử thay đổi trạng thái của Khách hàng (`Customer`) và Hồ sơ (`NenkinApplication`) là cực kỳ quan trọng để truy vết (audit) và giải quyết khiếu nại.

### 2.1. Cấu trúc Dữ liệu Đề xuất
Cần bổ sung một cơ chế AuditLog vào cơ sở dữ liệu (ví dụ model `AuditLog`) với các yêu cầu sau:
- **entityId**: ID của đối tượng bị thay đổi (Customer ID hoặc Application ID).
- **entityType**: Loại đối tượng (`CUSTOMER`, `APPLICATION`).
- **fromState**: Trạng thái trước khi chuyển đổi.
- **toState**: Trạng thái sau khi chuyển đổi.
- **actionBy**: Người thực hiện thay đổi (ID của `User` là nhân viên, hoặc ID của `Customer` nếu khách hàng tự thao tác).
- **actionAt**: Thời gian thực hiện chuyển đổi (Timestamp).
- **metadata**: Dữ liệu bổ sung (JSON) bao gồm: lý do từ chối (revision note), địa chỉ IP, User-Agent, hoặc các thay đổi field quan trọng đi kèm.

### 2.2. Quy tắc Ghi Log
- Bất cứ khi nào trường `status` của `Customer` hoặc `NenkinApplication` bị thay đổi, hệ thống bắt buộc phải hook vào quá trình update để sinh ra một bản ghi trong bảng AuditLog.
- Không cho phép chỉnh sửa hoặc xóa các bản ghi AuditLog (Append-only).

---

## 3. TÁI CẤU TRÚC GIAO DIỆN (UI REFACTORING) & VALIDATION
Các trang có kiến trúc nguyên khối (monolithic) hiện tại như `customers/page.tsx` hoặc `applications/page.tsx` sẽ được tái cấu trúc thành các module nhỏ, dễ quản lý, kết hợp cùng tiêu chuẩn xác thực dữ liệu cao nhất.

### 3.1. Module hóa Component (Modular Components)
- **Tách biệt Logic và View:** Giao diện quản lý cần chia nhỏ thành các Server/Client Components độc lập:
  - `CustomerTable` / `CustomerCardList` (Dành cho hiển thị thiết bị di động).
  - `CustomerFilters` (Bộ lọc tìm kiếm nâng cao).
  - `CustomerFormModal` / `ApplicationStateModal` (Chứa form nhập liệu và action).
- **Phong cách Glassmorphism:** Các components (đặc biệt là Modal, Card, Navbar) phải sử dụng hiệu ứng nền mờ (backdrop-filter: blur), viền mỏng semi-transparent, shadow nhẹ để tạo cảm giác tối giản hiện đại (Modern Minimalist).
- **Responsive & Mobile-first:** Mọi bảng (table) khi hiển thị trên màn hình nhỏ (<768px) đều phải tự động chuyển đổi sang dạng `Card Lists`.

### 3.2. Strict Form Validation với `zod` và `react-hook-form`
- **Thay thế quản lý State:** Loại bỏ việc sử dụng `useState` thủ công cho các form lớn. Chuyển sang sử dụng hoàn toàn `react-hook-form`.
- **Zod Schema:** Mọi payload submit từ UI phải được định nghĩa bằng `zod` schema ở thư mục dùng chung (ví dụ `src/lib/validations/`).
- **Real-time Feedback:** Hiển thị lỗi trực quan ngay dưới từng field nhập liệu (Inline validation) thay vì đợi submit mới báo lỗi.

---

## 4. CHUẨN HÓA STATE MACHINE CHO `NenkinApplication`
Quá trình chuyển đổi trạng thái của hồ sơ Nenkin cần tuân thủ một cỗ máy trạng thái (State Machine) với các Guard Clauses khắt khe để đảm bảo dữ liệu không bị thiếu hụt khi nộp cho Cục Thuế.

### 4.1. Điều kiện chuyển đổi trạng thái (Mandatory Fields Rule)

| Từ Trạng Thái | Sang Trạng Thái | Điều kiện bắt buộc (Validation Guard) |
| :--- | :--- | :--- |
| `PENDING` | `DRAFT` | Nhân viên phải kiểm tra OCR. Bắt buộc có: `fullName`, `dob`, `zairyuAddress`. |
| `DRAFT` | `SENT_1ST` | Hồ sơ Khách hàng phải có đủ hình ảnh: Thẻ Zairyu, Hộ chiếu, Sổ Nenkin.<br/>Bắt buộc nhập: `applyDate` (Ngày nộp) và `nenkinNumber`. |
| `SENT_1ST` | `RECEIVED_1ST` | Bắt buộc nhập: `noticeDate`, `noticeImageUrl` (Ảnh giấy báo Cục Thuế trả về), `totalExpectedJpy` (Tổng tiền báo), và `received1stJpy` (Tiền thực nhận Lần 1). |
| `RECEIVED_1ST` | `SENT_2ND` | Bắt buộc phải được gán một `taxRepresentativeId` (Người đại diện khai thuế).<br/>Bắt buộc nhập: `sent2ndDate`. |
| `SENT_2ND` | `RECEIVED_2ND` | Bắt buộc nhập: `received2ndDate`, `received2ndJpy` (Tiền nhận Lần 2), `tax2ndJpy` (Thuế Lần 2). |
| `RECEIVED_2ND` | `COMPLETED` | Bắt buộc có thông tin tính toán hoàn tất: `serviceFeeJpy`, `exchangeRate`, `serviceFeeVnd`. |
| *(Bất kỳ)* | `REVISION_REQUIRED`| Phải đính kèm text ở trường `revisionNote` để giải thích lý do yêu cầu bổ sung/sửa đổi. |

### 4.2. Action Buttons & UI
- Nút chuyển đổi trạng thái chỉ hiển thị/enable khi dữ liệu (form data) thỏa mãn schema validation của trạng thái đích.
- Hành động duyệt (Approve) hoặc Yêu cầu làm lại (Request Retake) phải hiển thị trong một Modal xác nhận có thiết kế Glassmorphism gọn gàng.

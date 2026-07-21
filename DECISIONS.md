# QUYẾT ĐỊNH KIẾN TRÚC (DECISIONS)

Tài liệu này ghi lại các quyết định thiết kế kiến trúc và công nghệ quan trọng cho dự án NenkinPro trong Phase 1.

## 1. Quyết định sử dụng `react-hook-form` kết hợp `zod`

Việc chuyển từ quản lý form state truyền thống (`useState`) sang bộ đôi `react-hook-form` và `zod` được quyết định dựa trên các yếu tố sau:

### 1.1. Tối ưu Hiệu năng (Performance)
- **Vấn đề:** Các trang giao diện quản lý hiện tại như `CustomerFormModal` hay các form thu thập hồ sơ rất lớn. Việc dùng `useState` cho mỗi trường input sẽ kích hoạt re-render toàn bộ component mỗi khi người dùng gõ phím.
- **Giải pháp:** `react-hook-form` sử dụng kiến trúc uncontrolled components, quản lý state nội bộ qua `ref`, từ đó loại bỏ hoàn toàn các re-render không cần thiết trên quy mô form lớn. Đảm bảo trải nghiệm UI luôn mượt mà.

### 1.2. Mức độ An toàn Kiểu (Type-Safety) và Nguồn Chân lý Duy nhất (Single Source of Truth)
- `zod` cho phép định nghĩa schema một lần duy nhất tại thư mục dùng chung (`src/lib/validations/`).
- Các schema này vừa được sử dụng ở tầng Client (qua `@hookform/resolvers/zod` để hiển thị lỗi Inline Validation realtime) vừa được dùng ở tầng API Server để xác thực payload, đảm bảo không có lỗ hổng bảo mật hoặc dữ liệu rác lọt vào cơ sở dữ liệu. Giảm bớt effort khi bảo trì.

## 2. Xác thực Luồng Chuyển đổi Trạng thái (State Machine Validation) tại tầng API

Với logic State Machine phức tạp và các Guard Clauses khắt khe theo từng giai đoạn của `NenkinApplication`, kiến trúc API sẽ được thiết kế để thi hành (enforce) các quy tắc này một cách tập trung.

### 2.1. Sử dụng Zod Schema Động theo Trạng thái (Dynamic Zod Schemas)
- (Đã implement tại `src/lib/services/applicationService.ts`)
- Khi Client gửi request chuyển trạng thái (VD: payload đổi từ `DRAFT` sang `SENT_1ST`), API tự động ánh xạ (map) trạng thái đích `SENT_1ST` tương ứng với một `sent1stSchema` cụ thể.
- API sẽ gọi `sent1stSchema.parse(validationData)` (dữ liệu payload kèm theo dữ liệu bản ghi hiện tại trong database) để đảm bảo tại thời điểm chuyển đổi, mọi trường bắt buộc (Zairyu, Passport, Nenkin Book...) đã đầy đủ hợp lệ.

### 2.2. Prisma Extension / Middleware cho Cơ chế AuditLog
- Để đảm bảo tính toàn vẹn và không bỏ sót thao tác, logic ghi `AuditLog` đã được đặt tập trung tại service layer (`applicationService.ts`).
- **Giải pháp:** Áp dụng mô hình Repository Service Layer bọc lại Prisma. Mọi truy vấn update có sự thay đổi của field `status` trên bảng `Customer` hoặc `NenkinApplication` đều:
  1. Đọc trạng thái cũ (`fromState`).
  2. Xác định trạng thái mới (`toState`).
  3. Lấy thông tin session user hiện hành làm `actionBy`.
  4. Thực thi việc update bảng chính và insert vào bảng `AuditLog` trong cùng một **Database Transaction** nguyên tử (Atomic Transaction: `prisma.$transaction`). Nếu có lỗi xảy ra (ví dụ: mất kết nối DB nửa chừng, hoặc không thoả mãn Zod schema), toàn bộ lệnh sẽ được rollback, giúp dữ liệu luôn nhất quán.

## 3. Kiến trúc UI Components & Modularization
- Áp dụng triết lý Module hóa (Modular Components). Logic và view được tách biệt thành các khối nhỏ gọn (`CustomerTable`, `CustomerFormModal`, `CustomerFilters`).
- (Phase 2): Đã module hóa luồng Customer/Application flow (tách biệt dữ liệu Application theo từng chặng thông qua `applicationService.ts` và các Zod validation schemas tách biệt).
- Thống nhất phong cách Modern Minimalist Glassmorphism xuyên suốt hệ thống, sử dụng `backdrop-filter` tạo chiều sâu cho UI và áp dụng Mobile-first (Table tự thu gọn thành Card trên điện thoại).

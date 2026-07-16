# HỒ SƠ DỰ ÁN: NenkinPro

## Tổng quan nghiệp vụ
NenkinPro là ứng dụng quản lý hoàn thuế lương hưu (年金脱退一時金 — Nenkin Lump-sum Withdrawal) cho người nước ngoài rời Nhật Bản. Đây là nghiệp vụ B2B nội bộ do các công ty dịch vụ người Việt tại Nhật vận hành: thu nhận hồ sơ khách hàng → chuẩn bị, nộp biểu mẫu hành chính Nhật Bản → theo dõi tiến trình hoàn tiền → khai thuế → giải ngân cho khách.

## Data Model — 8 Entities chính
- **User**: Nhân viên nội bộ (ADMIN / MANAGER / COLLABORATOR)
- **Customer**: Khách hàng người nước ngoài tại Nhật
- **NenkinApplication**: Hồ sơ hoàn thuế nenkin của từng khách
- **TaxOffice**: Cục thuế Nhật Bản quản lý hồ sơ
- **TaxRepresentative**: Người đại diện nộp thuế (纳税管理人)
- **WorkHistory**: Lịch sử làm việc tại Nhật
- **TransferRequest**: Yêu cầu chuyển khách giữa nhân viên
- **ExchangeRate**: Tỷ giá JPY/VND theo ngày

## Luồng nghiệp vụ chính (Business Flows)
### Flow 1 — Tiếp nhận Khách hàng
Khách hàng liên hệ → Nhân viên tạo Customer (+ upload ảnh giấy tờ) → OCR tự động đọc Zairyu/Passport (AI) → Xác minh thông tin → status: VERIFIED

### Flow 2 — Xử lý Hồ sơ Nenkin (Lần 1)
Tạo NenkinApplication → status: DRAFT → Chuẩn bị tài liệu (Biểu mẫu 脱退一時金請求書) → Nộp bưu điện → status: SENT_1ST → Nhận kết quả thông báo → status: RECEIVED_1ST → Ghi nhận số tiền (totalExpectedJpy, received1stJpy)

### Flow 3 — Khai thuế & Hoàn thuế (Lần 2)
Chuẩn bị tài liệu Lần 2 (委任状, 申告書) → Nộp cục thuế → status: SENT_2ND → Nhận kết quả hoàn thuế → status: RECEIVED_2ND → Tính tiền thực lãnh (扣除後支払額) → status: COMPLETED

### Flow 4 — Giải ngân & Phí dịch vụ
Tính toán:
- Tiền thực lãnh = received1stJpy + received2ndJpy - tax2ndJpy
- Phí dịch vụ = serviceFeeJpy
- VND = (tiền nhận - phí) × exchangeRate
- Hoa hồng CTV = +2,000 JPY nếu referralType = CUSTOMER
- Giảm giá khách được giới thiệu = -2,000 JPY

### Flow 5 — Xuất biểu mẫu (Form Generator)
applicationId + templateType → API: `/api/generate-doc` → `documentMapper.ts`: map data → flat JSON với ký tự được băm → docxtemplater: fill .docx template → Response: Binary blob → browser download

## Kế hoạch xây dựng — 6 Sprint
### Sprint 1 — Foundation & Design System (Ưu tiên cao nhất)
Chuẩn hóa Tailwind design tokens (màu, spacing, typography) theo chuẩn enterprise.
Tạo component library: Button, Input, Select, Table, Badge, Modal, Sidebar, Topbar.
Auth middleware + Session management (StaffSession).
Layout shell: Sidebar navigation + Topbar + Breadcrumb.

### Sprint 2 — Customer Management
Trang `/customers`: danh sách + filter + phân trang + search.
Trang onboarding: multi-step form thu thập dữ liệu khách.
Upload ảnh tài liệu (Zairyu, Passport, Nenkin book…) → Supabase Storage.
OCR integration: gọi AI đọc văn bản từ ảnh → auto-fill form.

### Sprint 3 — Application Workflow
Trang `/applications`: Kanban / List view theo trạng thái (DRAFT→COMPLETED).
Trang `/applications/[id]`: Chi tiết đầy đủ, chỉnh sửa inline.
Status transition UI với validation rules.
Ghi chú revision, lịch sử thay đổi.

### Sprint 4 — PDF Form Generator ⭐ ĐANG THỰC HIỆN
- [x] PR 1 — Template Registry: Cơ sở dữ liệu tĩnh `don-xin-lan-1` và SHA-256 fingerprint.
- [x] PR 2 — PDF Mapping Studio: Giao diện web chỉnh tọa độ field trên PDF, kéo-thả, lưu Draft vào Database.
- [ ] PR 3 — Workflow Review & Publish: Trình xét duyệt Draft thành Published Version, tạo PDF Preview.
- [ ] PR 4 — Port AI/OCR + Address Lookup từ bản cũ.
- [ ] Thay thế hoàn toàn `.docx` form builder cũ bằng PDF overlay tuyệt đối.

### Sprint 5 — Finance & Reporting
Trang `/finance`: bảng tỷ giá, tính toán phí dịch vụ, hoa hồng CTV.
Báo cáo doanh thu, tổng hợp theo tháng/năm.
Export Excel/CSV toàn bộ danh sách hồ sơ.

### Sprint 6 — HR, Admin & Portal
`/hr`: quản lý nhân viên, phân quyền Role-based.
TransferRequest: chuyển khách hàng giữa nhân viên.
`/portal`: giao diện khách hàng tự kiểm tra trạng thái hồ sơ.
`/admin`: system settings, logs, backup.

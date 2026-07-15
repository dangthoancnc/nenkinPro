# PROJECT PROFILE — NenkinPro

> **Nguồn sự thật duy nhất (Single Source of Truth)** cho cả PE (Perplexity) và AN (AntiGravity).  
> Cập nhật file này mỗi khi có thay đổi lớn về kiến trúc hoặc tiến độ.

---

## 1. Tổng quan dự án

| Thuộc tính | Giá trị |
|---|---|
| **Tên** | NenkinPro |
| **Loại** | B2B Internal Web App (Next.js 15 + App Router) |
| **Nghiệp vụ** | Quản lý hoàn thuế lương hưu Nhật Bản (年金脱退一時金) cho người nước ngoài |
| **Đối tượng dùng** | Nhân viên công ty dịch vụ người Việt tại Nhật |
| **Repo** | https://github.com/dangthoancnc/nenkinPro |
| **Database** | PostgreSQL (Supabase) — project: nwaxlfuztnismocuuoyc |
| **ORM** | Prisma |
| **Runtime** | Windows, Node.js 20+, `--max-old-space-size=4096` |

---

## 2. Data Model — 8 Entities

| Entity | Table | Mô tả |
|---|---|---|
| `User` | `nenkin_users` | Nhân viên nội bộ. Role: ADMIN / MANAGER / COLLABORATOR |
| `StaffSession` | `nenkin_staff_sessions` | JWT session token, có expiry & revoke |
| `Customer` | `nenkin_customers` | Khách hàng người nước ngoài tại Nhật |
| `NenkinApplication` | `nenkin_applications` | Hồ sơ hoàn thuế nenkin, trạng thái từ DRAFT → COMPLETED |
| `TaxOffice` | `nenkin_tax_offices` | Cục thuế Nhật Bản quản lý hồ sơ |
| `TaxRepresentative` | `nenkin_tax_representatives` | Người đại diện nộp thuế (納税管理人) |
| `WorkHistory` | `nenkin_work_histories` | Lịch sử làm việc tại Nhật (theo từng Customer) |
| `TransferRequest` | `nenkin_transfer_requests` | Yêu cầu chuyển khách giữa nhân viên |
| `ExchangeRate` | `nenkin_exchange_rates` | Tỷ giá JPY/VND theo ngày |
| `OcrResult` | `nenkin_ocr_results` | Kết quả OCR từ ảnh giấy tờ |

---

## 3. Trạng thái ApplicationStatus (Vòng đời hồ sơ)

```
DRAFT → PENDING → SENT_1ST → RECEIVED_1ST → SENT_2ND → RECEIVED_2ND → COMPLETED
                 ↗
    REVISION_REQUIRED (quay lại sửa)
                                                             ↓
                                                        CANCELLED
```

---

## 4. Luồng nghiệp vụ chính

### Flow 1 — Tiếp nhận Khách hàng
```
Khách liên hệ
  → Nhân viên tạo Customer (upload ảnh: Zairyu, Passport, Nenkin Book...)
  → OCR tự động đọc giấy tờ (Gemini 2.5 Flash) → auto-fill
  → Xác minh thông tin → status: VERIFIED
```

### Flow 2 — Hồ sơ Lần 1 (脱退一時金請求書)
```
Tạo NenkinApplication (status: DRAFT)
  → Chuẩn bị tài liệu → Xuất biểu mẫu 脱退一時金請求書.docx
  → Nộp bưu điện → status: SENT_1ST
  → Nhận kết quả → status: RECEIVED_1ST
  → Ghi nhận: totalExpectedJpy, received1stJpy, withheldTax
```

### Flow 3 — Hồ sơ Lần 2 (Khai thuế + Hoàn thuế)
```
Chuẩn bị: 委任状.docx + 納税管理人届出書.docx
  → Nộp cục thuế → status: SENT_2ND
  → Nhận kết quả → status: RECEIVED_2ND
  → Ghi nhận: received2ndJpy, tax2ndJpy
  → status: COMPLETED
```

### Flow 4 — Tính toán tài chính
```
Tiền thực lãnh = received1stJpy + received2ndJpy - tax2ndJpy
Phí dịch vụ = serviceFeeJpy
VND về = (tiền nhận - phí) × exchangeRate
Hoa hồng CTV = +2,000 JPY (nếu referralType = CUSTOMER)
Giảm giá KH được giới thiệu = -2,000 JPY
```

### Flow 5 — Form Generator (M4)
```
UI: Nút [Xuất Biểu Mẫu] trên /applications/[id]
  → POST /api/generate-doc { applicationId, templateType }
  → Server: Prisma fetch → documentMapper.ts → docxtemplater.render()
  → Response: .docx Binary Blob → browser auto-download
```

---

## 5. Cấu trúc Routes

| Route | Chức năng | Trạng thái |
|---|---|---|
| `/login` | Đăng nhập nhân viên | ✅ Có |
| `/dashboard` | KPI tổng quan | ✅ Có |
| `/customers` | Danh sách khách hàng | ✅ Có |
| `/customers/new` | Tạo khách hàng (multi-step) | ✅ Có |
| `/onboarding` | Onboarding khách hàng | ✅ Có |
| `/applications` | Danh sách hồ sơ nenkin | ✅ Có |
| `/applications/[id]` | Chi tiết hồ sơ + xuất biểu mẫu | ✅ Có |
| `/finance` | Tỷ giá, tài chính | ✅ Có |
| `/hr` | Quản lý nhân viên | ✅ Có |
| `/tax-offices` | Quản lý cục thuế | ✅ Có |
| `/admin` | Admin panel | ✅ Có |
| `/portal` | Cổng thông tin khách hàng | ✅ Có |
| `/settings` | Cài đặt | ✅ Có |
| `/api/generate-doc` | API xuất biểu mẫu .docx | ✅ Có |

---

## 6. Kế hoạch Sprint

### Sprint 1 — Foundation & Design System
- [ ] Chuẩn hóa Tailwind design tokens
- [ ] Component library: Button, Input, Select, Table, Badge, Modal
- [ ] Auth middleware + Session management (StaffSession)
- [ ] Layout shell: Sidebar + Topbar + Breadcrumb

### Sprint 2 — Customer Management
- [ ] `/customers`: danh sách + filter + phân trang + search
- [ ] `onboarding`: multi-step form
- [ ] Upload ảnh tài liệu → Supabase Storage
- [ ] OCR integration (Gemini 2.5 Flash) → auto-fill

### Sprint 3 — Application Workflow
- [ ] `/applications`: Kanban / List view theo trạng thái
- [ ] `/applications/[id]`: Chi tiết + chỉnh sửa inline
- [ ] Status transition UI với validation
- [ ] Ghi chú revision + lịch sử thay đổi

### Sprint 4 — Form Generator M4 ⭐ ĐANG THỰC HIỆN
- [x] `documentMapper.ts`: map dữ liệu → flat JSON, băm ký tự
- [x] API `/api/generate-doc`: Prisma → mapper → docxtemplater → file
- [ ] `MAPPING_GUIDE.md`: liệt kê đầy đủ tất cả `{{tags}}`
- [ ] UI card "Xuất Biểu Mẫu" hoàn chỉnh trên `/applications/[id]`
- [ ] Test script `scratch/test_mapper.ts`

### Sprint 5 — Finance & Reporting
- [ ] Báo cáo doanh thu, tổng hợp tháng/năm
- [ ] Export Excel/CSV danh sách hồ sơ

### Sprint 6 — HR, Admin & Portal
- [ ] RBAC hoàn chỉnh
- [ ] TransferRequest workflow
- [ ] Customer portal

---

## 7. Tiêu chuẩn kỹ thuật

| Hạng mục | Tiêu chuẩn |
|---|---|
| Framework | Next.js 15 App Router + TypeScript strict |
| Auth | JWT session (StaffSession table) + RBAC |
| Database | PostgreSQL via Prisma + Supabase |
| UI | Tailwind CSS v4 + Radix UI |
| Form validation | React Hook Form + Zod |
| Document export | `docxtemplater` + `PizZip` |
| OCR | Gemini 2.5 Flash |
| File Storage | Supabase Storage |
| Accessibility | WCAG 2.1 AA |
| i18n | UI tiếng Việt, tài liệu output tiếng Nhật |

---

## 8. Phân công PE + AN

| Nhiệm vụ | PE (Perplexity) | AN (AntiGravity) |
|---|---|---|
| Phân tích nghiệp vụ | ✅ Primary | Hỗ trợ |
| Thiết kế schema / API contract | ✅ Primary | Hỗ trợ |
| Viết code thực thi | Hỗ trợ | ✅ Primary |
| Commit / Push GitHub | ❌ | ✅ Primary |
| Review logic, lỗi tiềm ẩn | ✅ Primary | Hỗ trợ |
| Tài liệu Mapping / Template Guide | ✅ Primary | Hỗ trợ |
| Test chạy thực tế | ❌ | ✅ Primary |

---

*Cập nhật lần cuối: 2026-07-15 bởi PE + AN*

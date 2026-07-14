# Original User Request

## Initial Request — 2026-05-31T03:13:50Z

Xây dựng Form Generator (Cột mốc M4) trong ứng dụng Next.js hiện tại để tự động điền dữ liệu từ cơ sở dữ liệu vào các biểu mẫu hành chính Nhật Bản (Nenkin Lần 1 và Lần 2). Yêu cầu sử dụng `docxtemplater` và bao gồm một bộ "Data Mapper" để băm nhỏ các chuỗi văn bản thành từng ký tự riêng lẻ (ví dụ: ngày sinh, số tài khoản ngân hàng) sao cho vừa khít với cấu trúc "mỗi ô một ký tự" của biểu mẫu Word. Bổ sung nút "Tải Xuất Biểu Mẫu" trên giao diện.

Thư mục làm việc: G:\AntiGravity\apps\nenkin
Chế độ toàn vẹn (Integrity mode): development

## Yêu Cầu (Requirements)

### R1. Triển khai Data Mapper (`src/lib/documentMapper.ts`)
Tạo một hàm tiện ích `mapApplicationToTemplate(application: any)` nhận vào toàn bộ object `NenkinApplication` (bao gồm các quan hệ `Customer`, `TaxOffice`, `TaxRepresentative`) và ánh xạ chúng thành một object JSON phẳng (flat) phù hợp cho `docxtemplater`.
Điều quan trọng nhất: các chuỗi cần điền vào các ô ký tự phải được "băm" thành nhiều biến được đánh số thứ tự. Ví dụ:
- `customer.postalCode` ('123-4567') -> `post_1: '1'`, `post_2: '2'`, v.v.
- `customer.bankAccount` ('1234567') -> `bank_1: '1'`, `bank_2: '2'`, v.v.
- Ngày tháng (VD: Ngày sinh) phải được tách thành Năm, Tháng, Ngày và ưu tiên chuyển sang Niên hiệu Nhật Bản (Reiwa/Heisei) hoặc tách thành các số `dob_y1`, `dob_y2`, `dob_m1`, `dob_m2`.
- MyNumber (12 số) -> `my_num_1` đến `my_num_12`.
- Số Nenkin (10 số) -> `nenkin_1` đến `nenkin_10`.

### R2. Nâng cấp API Endpoint (`src/app/api/generate-doc/route.ts`)
Chỉnh sửa API hiện tại để:
1. Nhận vào `applicationId` và `templateType` (ví dụ: 'LAN1_DATTAI', 'LAN2_UININJOU', 'LAN2_TAX_AGENT').
2. Truy xuất dữ liệu qua Prisma (`prisma.nenkinApplication.findUnique` kèm `include`).
3. Xử lý dữ liệu qua `documentMapper.ts`.
4. Render file `.docx` tương ứng bằng `docxtemplater` (ví dụ: `脱退一時金請求書.docx`, `委 任 状.docx`).
5. Trả về Blob file `.docx` để trình duyệt tải xuống.

### R3. Thêm Nút Tải Biểu Mẫu trên UI (`src/app/applications/[id]/page.tsx`)
Thêm một Card hoặc khu vực "Xuất Biểu Mẫu" trong trang Chi tiết Hồ sơ, chứa các nút để tải các template tương ứng. Khi click, hệ thống sẽ gọi API và kích hoạt tính năng tải file nhị phân của trình duyệt.

### R4. Tài liệu Hướng dẫn Cấu hình Template
Tuyệt đối KHÔNG cố gắng tự sửa các file `.docx` nhị phân (tránh làm hỏng file). Thay vào đó, hãy tạo một file markdown `public/templates/MAPPING_GUIDE.md` liệt kê toàn bộ các biến đã được `documentMapper.ts` tạo ra, để người dùng biết chính xác cần điền thẻ `{{tags}}` nào vào trong file Word.

## Tiêu Chí Nghiệm Thu (Acceptance Criteria)

### Xác minh (Verification)
- [ ] Phải cung cấp một test script (`scratch/test_mapper.ts`) để chạy hàm `mapApplicationToTemplate` với dữ liệu mẫu `NenkinApplication`. Output log phải hiển thị thành công các biến đã được băm nhỏ như `bank_1: '1'`, `bank_2: '2'`.
- [ ] API endpoint không được crash khi được gọi; phải đọc thành công file template `.docx`, thực thi `docxtemplater.render()`, và trả về status 200 OK kèm theo file Word (Buffer/Blob).
- [ ] Các nút trên UI phải kích hoạt thành công tính năng tự động tải file trên trình duyệt mà không làm chuyển trang (no page navigation).
- [ ] File `MAPPING_GUIDE.md` phải đầy đủ và có các ví dụ rõ ràng về cách map một tài khoản ngân hàng 7 số bằng các thẻ từ `{{bank_1}}` đến `{{bank_7}}`.

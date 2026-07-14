# Kế hoạch Triển khai: Hệ thống Quản lý Dịch vụ Lấy Nenkin (Nenkin Refund Management System)

Dự án này nhằm xây dựng một phần mềm SaaS (Software as a Service) cấp doanh nghiệp, chuyên biệt cho nghiệp vụ hỗ trợ người lao động Việt Nam lấy lại tiền Nenkin (lương hưu Nhật Bản) sau khi về nước. Hệ thống tích hợp quản lý khách hàng, nhân sự, theo dõi tiến độ hồ sơ, tự động hóa trích xuất dữ liệu từ hình ảnh và tự động điền form (PDF/Word).

## User Review Required
> [!IMPORTANT]
> Đây là một hệ thống lớn với nhiều luồng nghiệp vụ phức tạp. Vui lòng xem xét kỹ phần **Quy trình Tự động hóa** và **Cấu trúc Cơ sở dữ liệu** để đảm bảo đúng với thực tế nghiệp vụ của công ty bạn.

## Open Questions
> [!WARNING]
> Để có thể bắt đầu xây dựng chính xác, tôi cần bạn cung cấp/xác nhận các thông tin sau:
> 1. **Mẫu giấy tờ (Forms):** Bạn có sẵn các file mẫu PDF hoặc Word gốc (chưa điền) của **Ủy nhiệm thư (委任状)** và **Đơn xin hoàn trả Nenkin (脱退一時金請求書)** không? (Cần có để làm template tự động điền dữ liệu).
> 2. **Dữ liệu Cục Thuế (Zeimusho):** Bạn có sẵn bộ dữ liệu ánh xạ (mapping) từ Mã bưu điện (Zipcode) -> Cục thuế quản lý không? Hay chúng ta sẽ cào (crawl) dữ liệu này từ trang web của Cục Thuế Quốc Gia Nhật Bản (NTA)?
> 3. **Công nghệ Backend/Database:** Với hệ thống này, tôi đề xuất dùng **Next.js (React) cho Frontend/Backend, PostgreSQL cho Database**. Bạn có đồng ý với stack công nghệ này không?
> 4. **Tích hợp AI/OCR:** Để đọc Thẻ ngoại kiều (Zairyu Card), tôi đề xuất dùng API của Google Cloud Vision hoặc trực tiếp dùng LLM (Gemini) để trích xuất thông tin. Bạn đã có sẵn tài khoản Cloud nào chưa?

---

## 1. Phân tích Yêu cầu & Tính năng cốt lõi (Features)

### 1.1 Quản lý Khách hàng (Customers)
- **Thông tin cá nhân:** Họ tên (Romaji/Katakana), Ngày sinh, Địa chỉ cuối cùng ở Nhật, Sổ Nenkin (Mã số hưu trí cơ bản).
- **Thông tin ngân hàng:** Ngân hàng Việt Nam / Nhật Bản, Chi nhánh, Số tài khoản, Tên chủ tài khoản, Swift code (đối với ngân hàng VN).
- **Tài liệu đính kèm:** Upload ảnh Thẻ ngoại kiều (Zairyu card), Hộ chiếu, Sổ Nenkin, Sổ ngân hàng.

### 1.2 Quản lý Nhân sự & Hoa hồng (HR & Commission)
- **Roles (Phân quyền):** Super Admin, Quản lý (Manager), Cộng tác viên (Collaborator).
- **Quản lý Cộng tác viên:** Lưu trữ thông tin CTV, mã giới thiệu.
- **Tính toán Lương & Hoa hồng:** Tự động tính % hoa hồng cho CTV dựa trên số lượng/doanh thu hồ sơ Nenkin hoàn thành.

### 1.3 Module Nghiệp vụ Nenkin (Nenkin Workflow)
- **Theo dõi Tiến độ (Status Tracking):**
  - Ngày lập hồ sơ
  - Ngày gửi hồ sơ (Lần 1 - lấy 80%)
  - Ngày nhận tiền Lần 1
  - Ngày gửi hồ sơ (Lần 2 - lấy 20% tiền thuế)
  - Ngày nhận tiền Lần 2
- **Tính toán Tài chính:** Tính tổng tiền Nenkin dự kiến, phí dịch vụ (Service Fee), quy đổi tỷ giá JPY/VND theo thời gian thực (API tỷ giá).

### 1.4 Tự động hóa (Automation)
- **AI/OCR Trích xuất dữ liệu:** Tự động đọc ảnh Thẻ ngoại kiều (Mặt trước/Mặt sau) -> Trích xuất Tên, Ngày sinh, **Địa chỉ cư trú**.
- **Tra cứu Địa chỉ & Thuế:** 
  - Từ Địa chỉ -> Tra cứu Mã bưu điện (Zipcode).
  - Từ Mã bưu điện -> Xác định Cục thuế (Tax Office) quản lý khu vực đó.
- **Auto-fill Forms:** Tự động điền thông tin (Tên, Địa chỉ, Mã số thuế, Thông tin người đại diện nộp thuế) vào các file PDF (委任状, Đơn hoàn thuế).

---

## 2. Đề xuất Kiến trúc Hệ thống (Architecture)

### Tech Stack
- **Frontend/Backend:** `Next.js` (React framework) hỗ trợ tốt cho cả UI hiện đại và API routes xử lý logic nghiệp vụ.
- **Styling:** `TailwindCSS` + thư viện Component (như `shadcn/ui` hoặc `Mantine`) để thiết kế giao diện Doanh nghiệp cao cấp, chuyên nghiệp (Premium Design).
- **Database:** `PostgreSQL` (Sử dụng `Prisma ORM` hoặc `Drizzle` để tương tác DB). Phù hợp nhất cho hệ thống có quan hệ phức tạp (Khách hàng - Hồ sơ - Nhân sự).
- **Storage:** Amazon S3 hoặc Supabase Storage để lưu trữ ảnh/hồ sơ khách hàng an toàn.
- **PDF Generation:** Sử dụng `pdf-lib` để ghi đè (fill) text vào các template PDF có sẵn.

### Database Schema (Dự kiến)
- `Users` (Admin, Manager, Collaborator)
- `Customers` (Thông tin cá nhân khách hàng)
- `BankAccounts` (Tài khoản ngân hàng của KH)
- `NenkinApplications` (Hồ sơ Nenkin: trạng thái, các mốc thời gian, số tiền)
- `TaxOffices` (Danh mục Cục thuế và mã bưu điện)

---

## 3. Quy trình Triển khai (Execution Plan)

- **Giai đoạn 1: Khởi tạo & Xây dựng Cấu trúc nền tảng (Foundation)**
  - Setup Next.js, PostgreSQL.
  - Xây dựng UI/UX Hệ thống Design System (với màu sắc chuyên nghiệp, giao diện quản trị dashboard).
  - Thiết kế và Migration Database.

- **Giai đoạn 2: Module Quản lý (HR & Customer)**
  - Chức năng đăng nhập, phân quyền.
  - CRUD Quản lý nhân sự, Cộng tác viên.
  - CRUD Quản lý thông tin khách hàng, upload giấy tờ.

- **Giai đoạn 3: Module Nghiệp vụ & Tài chính (Nenkin Logic)**
  - Xây dựng luồng theo dõi hồ sơ (Lần 1, Lần 2).
  - Tích hợp API tỷ giá ngoại tệ, module tính phí/hoa hồng.

- **Giai đoạn 4: Tự động hóa & AI (Automation core)**
  - Tích hợp Google Vision / Gemini API để OCR thẻ ngoại kiều.
  - Xây dựng logic Mapping: Địa chỉ -> Mã bưu điện -> Cục thuế.
  - Tích hợp `pdf-lib` để tự động tạo form 委任状 (Ủy nhiệm thư).

## Verification Plan
1. **Kiểm tra luồng OCR:** Upload thử 3 thẻ ngoại kiều khác nhau, xác nhận hệ thống đọc đúng tên và địa chỉ.
2. **Kiểm tra Mapping Cục Thuế:** Nhập thử 5 địa chỉ khác nhau (ví dụ ở Tokyo, Osaka, Saitama), kiểm tra xem hệ thống có chọn đúng Cục Thuế quản lý không.
3. **Kiểm tra Auto-fill PDF:** Xuất thử 委任状 của một khách hàng, kiểm tra độ chính xác, vị trí chữ ký, phông chữ Nhật (Shift-JIS/UTF-8) trên file PDF.
4. **Kiểm tra Phân quyền:** Login bằng tài khoản CTV, đảm bảo chỉ nhìn thấy khách hàng do mình giới thiệu. Login bằng Manager, thấy toàn bộ.

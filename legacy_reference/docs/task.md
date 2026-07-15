# Nhiệm vụ (Task Checklist): Hệ thống Quản lý Dịch vụ Lấy Nenkin

- [x] **Giai đoạn 1: Khởi tạo & Xây dựng Cấu trúc nền tảng (Foundation)**
  - [x] Khởi tạo dự án Next.js với TypeScript và Tailwind CSS.
  - [x] Thiết lập Prisma ORM và cấu hình kết nối PostgreSQL.
  - [x] Thiết kế và tạo Database Schema (Users, Customers, BankAccounts, NenkinApplications).
  - [x] Xây dựng Layout và UI Component cơ bản (Dashboard, Navigation) với thiết kế hiện đại, chuyên nghiệp.

- [ ] **Giai đoạn 2: Module Quản lý (HR & Customer)**
  - [ ] Xây dựng tính năng Đăng nhập / Phân quyền (Auth).
  - [ ] Giao diện và API Quản lý Nhân sự (Managers, Collaborators).
  - [ ] Giao diện và API Quản lý Khách hàng (Thêm mới, sửa, xem thông tin).

- [ ] **Giai đoạn 3: Module Nghiệp vụ & Tài chính (Nenkin Logic)**
  - [ ] Xây dựng luồng theo dõi Hồ sơ Nenkin (Lần 1, Lần 2).
  - [ ] Tích hợp tính năng tính toán phí dịch vụ và quy đổi tỷ giá.

- [ ] **Giai đoạn 4: Tự động hóa & AI (Automation core)**
  - [x] Thiết lập module AI linh hoạt (Gemini / Local / Mock).
  - [ ] Xây dựng tính năng upload ảnh và tích hợp OCR (đọc thông tin từ Thẻ ngoại kiều).
  - [ ] Xây dựng logic tra cứu tự động: Địa chỉ -> Mã bưu điện -> Cục thuế.
  - [ ] Tích hợp thư viện xử lý PDF (pdf-lib) để tự động xuất các file 委任状 (Ủy nhiệm thư) và form Nenkin.

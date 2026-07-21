# Product Requirements Document (PRD) - Giai đoạn 3: Refactor Giao diện Chi tiết Hồ sơ

## 1. Mục tiêu (Objective)
Cải tổ (refactor) trang Chi tiết Hồ sơ (`/applications/[id]`) thành một giao diện hiện đại, chuyên nghiệp, tối ưu hóa cho tốc độ nhập liệu. Giao diện mới áp dụng cấu trúc 3 panel chính với khả năng cuộn độc lập (independent scroll). Điều này giúp người dùng vừa xem ảnh tài liệu, vừa nhập liệu và vừa theo dõi trạng thái hồ sơ thuế (workflow) trên cùng một màn hình mà không cần phải chuyển trang hay cuộn màn hình quá nhiều.

## 2. Yêu cầu UI/UX Chung (Tuân thủ High-Density Enterprise UI)
- **Khoảng cách (Spacing):** Thiết kế dạng compact. Sử dụng padding và margin nhỏ (ví dụ: `p-2`, `p-3`, `gap-2`).
- **Typography:** Kích thước chữ nhỏ gọn (`text-xs`, `text-[10px]`) cho các nhãn dán, nội dung bảng và mô tả phụ để tiết kiệm không gian.
- **Cấu trúc Cuộn (Scroll Behavior):** Toàn bộ Container của trang có chiều cao cố định (ví dụ `h-[calc(100vh-100px)]`). Các Panel sử dụng `overflow-y-auto` và `min-h-0` để giới hạn vùng cuộn nằm gọn bên trong từng Panel, không làm ảnh hưởng đến Panel khác.

## 3. Cấu trúc Layout 3 Panel

### 3.1. Panel Trái: Quản lý Tài liệu & Hình ảnh (Document & Image Gallery)
**Chức năng:** Quản lý tất cả chứng từ, tài liệu hình ảnh liên quan đến bộ hồ sơ thuế của khách hàng.
- **Danh mục tài liệu (Tabs):** Hiển thị dạng danh sách tab hoặc nút bấm gọn gàng cho các loại giấy tờ (Thẻ Ngoại Kiều Mặt Trước, Sau, Hộ chiếu, Sổ Nenkin, Sổ Ngân hàng, Dấu xuất cảnh). Có dấu hiệu nhận biết (ví dụ chấm màu xanh) nếu giấy tờ đó đã được tải ảnh lên.
- **Trình xem ảnh (Viewer):** 
  - Khung hiển thị ảnh chiếm toàn bộ không gian còn lại của Panel Trái (`object-contain`).
  - **Floating Toolbar:** Một thanh công cụ nổi (overlay) trên góc ảnh để thao tác nhanh:
    - **Nút Thay thế/Tải lên (Upload/Replace):** Bấm vào để chọn file. Giao diện hỗ trợ cả kéo thả (Drag & Drop). Ảnh sẽ được tự động lưu vào **Supabase Storage**.
    - **Nút Xóa (Delete):** Bấm để xóa ảnh khỏi bộ hồ sơ, xóa link tương ứng.
    - **Nút Phóng to (Zoom/Lightbox):** Bấm để xem ảnh chế độ toàn màn hình, giúp đọc chữ nhỏ dễ dàng hơn.
- Cần có trạng thái Loading (Spinner) khi hệ thống đang xử lý đẩy ảnh lên Supabase hoặc bóc tách bằng OCR.

### 3.2. Panel Giữa: Form Nhập liệu (Data Entry Forms)
**Chức năng:** Vùng nhập liệu động, thay đổi linh hoạt theo tài liệu đang được chọn ở Panel Trái. Người dùng nhìn ảnh bên trái và gõ văn bản bên phải.
- **Tính năng Contextual Form:**
  - *Khi chọn Thẻ Ngoại Kiều:* Hiển thị form nhập Họ tên, Ngày sinh, Quốc tịch, Số thẻ, Địa chỉ trên thẻ (Kanji), Mã số cá nhân (My Number).
  - *Khi chọn Hộ chiếu:* Hiển thị form Hộ chiếu gồm Họ tên, Ngày sinh, Giới tính, Số điện thoại, Ngày cấp, Ngày hết hạn.
  - *Khi chọn Sổ Nenkin:* Hiển thị form Số Nenkin.
  - *Khi chọn Sổ Ngân hàng:* Form Tên ngân hàng, Chi nhánh, Số tài khoản, Tên chủ tài khoản, Swift Code.
  - *Khi chọn Dấu xuất cảnh:* Ngày xuất cảnh.
- **Validation:** Sử dụng React Hook Form kết hợp Zod schema để kiểm tra lỗi đầu vào (báo đỏ nếu thiếu trường bắt buộc). Các input có kích thước nhỏ (`h-8`, `py-0.5`).

### 3.3. Panel Phải: Thông tin Trạng thái & Tiến độ Workflow
**Chức năng:** Quản lý quy trình xử lý, ghi nhận tiến độ hồ sơ Nenkin/Thuế và quản lý dòng tiền.
- **Header Thông tin thu gọn:** Hiển thị tóm tắt khách hàng ngay trên cùng của Panel (Ảnh đại diện nhỏ cắt từ Thẻ Ngoại Kiều, Họ tên, Mã Khách Hàng, Ngày sinh, Quốc tịch).
- **Tiến độ hồ sơ (Workflow Status):**
  - Hiển thị danh sách các trạng thái như lưới nút bấm: Cần duyệt, Bản nháp (DRAFT), Đã gửi Lần 1 (SENT_1ST), Đã nhận Lần 1, Đã gửi Lần 2, Đã nhận Lần 2, Hoàn thành.
  - Trạng thái đang kích hoạt được làm nổi bật (highlight). Người dùng nhấn để thay đổi trạng thái nếu ở chế độ Sửa.
- **Các mốc ngày xử lý:** Inputs dạng Date để nhập Ngày nộp (Lần 1, 2) và Ngày nhận (Lần 1, 2).
- **Thông tin Tài chính:**
  - Các ô điền: Dự kiến tổng (JPY), Thực nhận Lần 1 (JPY), Thực nhận Lần 2 (JPY), Tỷ giá (VND/JPY).
  - Nút **Tính phí (20%)**: Khi bấm sẽ tự động tính toán Phí dịch vụ (Dựa trên tổng tiền thực nhận) bằng đồng JPY và quy đổi sang VND theo Tỷ giá để hoàn tất hồ sơ.

## 4. Luồng xử lý kỹ thuật cơ bản
1. Hệ thống fetch dữ liệu hồ sơ qua `/api/applications/[id]`.
2. Ở Panel Trái, khi User thực hiện Upload ảnh, Client-side đẩy file về `/api/ocr` (hoặc API Storage). File được đưa lên Supabase Storage và trả về URL Public.
3. Khi lưu (Save), Client thu thập toàn bộ dữ liệu ở cả 3 Panel qua React Hook Form, gửi `PUT /api/applications/[id]` (và cập nhật bản ghi Customer nếu cần) vào Database.

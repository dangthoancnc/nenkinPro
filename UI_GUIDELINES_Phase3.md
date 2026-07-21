# UI/UX GUIDELINES - GIAI ĐOẠN 3: LAYOUT 3 PANEL (CHI TIẾT HỒ SƠ)

## 1. Tổng quan Kiến trúc Layout (3-Panel Layout)

Trang Chi tiết Hồ sơ (`/applications/[id]`) sẽ được chuyển đổi sang cấu trúc 3 panel giúp tối ưu hóa không gian hiển thị và giảm thiểu thao tác cuộn (scroll) không cần thiết của người dùng. Mỗi panel sẽ có một thanh cuộn độc lập (independent scroll).

- **Khung chứa chính (Main Container):**
  - Chiều cao cố định: `h-[calc(100vh-64px)]` (giả sử header ứng dụng là 64px, thay đổi giá trị trừ tùy theo cấu trúc thực tế).
  - Bố cục: `flex flex-row w-full gap-2 p-2`. Khóa thanh cuộn tổng (`overflow-hidden`).
- **Tỉ lệ phân chia Panel:**
  - **Panel Trái (Tài liệu & Hình ảnh):** `w-[35%]`
  - **Panel Giữa (Form Nhập liệu):** `w-[40%]`
  - **Panel Phải (Workflow & Tài chính):** `w-[25%]` (Hoặc `flex-1` để chiếm phần không gian còn lại).
- **Thuộc tính cuộn độc lập cho mỗi Panel:**
  - Cấu trúc chung cho từng panel: `flex flex-col min-h-0 h-full overflow-y-auto`.

## 2. High-Density Enterprise UI (Mật độ thông tin cao)

Giao diện áp dụng các nguyên tắc thiết kế cho ứng dụng doanh nghiệp (Enterprise), tập trung vào mật độ hiển thị thay vì các khoảng trắng lớn:

- **Spacing (Khoảng cách):**
  - Cực kỳ nhỏ gọn: `p-2`, `p-3`, `gap-2` cho layout chính.
  - Các phần tử bên trong (như khoảng cách giữa các input): `gap-1`, `mb-2`.
- **Typography (Chữ viết):**
  - Text chính & nhãn (Labels): `text-xs`.
  - Phụ đề / Ghi chú nhỏ: `text-[10px]`.
  - Tiêu đề khối (Section Header): `text-sm font-semibold`.
- **Compact Forms (Biểu mẫu thu gọn):**
  - **Input / Select:** Chiều cao cố định `h-8`, padding nhỏ `px-2 py-0.5`, chữ `text-xs`.
  - **Button:** Các nút chức năng phụ trong form có chiều cao `h-8`, chữ `text-xs`.
  - Bố cục Form: Hạn chế một cột, sử dụng `grid grid-cols-2 gap-2` để gom nhóm 2 trường dữ liệu trên cùng một dòng.

## 3. Thẩm mỹ Glassmorphism (Kính mờ)

Giao diện các Panel áp dụng phong cách Glassmorphism để tạo chiều sâu và cảm giác hiện đại, hòa hợp với nền của ứng dụng:

- **Màu sắc & Độ mờ (Background & Backdrop):**
  - Nền bán trong suốt: `bg-white/40` (chế độ sáng) hoặc `bg-slate-900/40` (chế độ tối).
  - Hiệu ứng kính (Blur): `backdrop-blur-md` hoặc `backdrop-blur-lg`.
- **Đường viền (Borders & Shadows):**
  - Viền mỏng, sáng nhẹ: `border border-white/20` (hoặc `border-slate-300/30`).
  - Bo góc nhẹ nhàng: `rounded-xl` hoặc `rounded-lg`.
  - Đổ bóng nhẹ để tách biệt các Panel với nền: `shadow-lg shadow-black/5`.

**Ví dụ một class Glassmorphism cơ bản cho Panel:**
`bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg p-3 flex flex-col min-h-0 overflow-y-auto`

## 4. Đặc tả chi tiết Từng Panel

### 4.1. Panel Trái: Quản lý Tài liệu & Hình ảnh (35%)
- **Mục đích:** Hiển thị và quản lý hình ảnh chứng từ.
- **Tabs Danh mục:**
  - Dạng nút bấm nhỏ gọn trên cùng: `flex flex-wrap gap-1 mb-2`.
  - Nút Tab: `px-2 py-1 text-[10px] rounded-md transition-colors`.
  - Trạng thái: Có chấm nhỏ màu xanh (`w-1.5 h-1.5 bg-green-500 rounded-full inline-block`) kế bên tên tab để báo hiệu đã có ảnh.
- **Trình xem ảnh (Image Viewer):**
  - Vùng chứa: `flex-1 relative bg-black/10 rounded-lg overflow-hidden flex items-center justify-center`.
  - Ảnh: `w-full h-full object-contain`.
  - **Floating Toolbar:** Đặt nổi phía trên góc dưới cùng bên phải của vùng xem ảnh.
    - Class: `absolute bottom-2 right-2 flex gap-1 bg-black/60 backdrop-blur-sm rounded p-1`.
    - Nút (Upload, Delete, Zoom): Kích thước `w-7 h-7 flex items-center justify-center text-white hover:bg-white/20 rounded`.
- **Loading State:** Icon spinner đặt giữa khung kèm text `text-xs text-gray-400` khi ảnh đang upload hoặc OCR.

### 4.2. Panel Giữa: Form Nhập liệu (40%)
- **Mục đích:** Khung nhập liệu linh hoạt (Contextual Form) theo tab ở Panel Trái.
- **Tiêu đề Form:** `text-sm font-semibold mb-3 border-b border-white/10 pb-1`.
- **Layout Fields:** 
  - Thường xuyên dùng `grid grid-cols-2 gap-x-2 gap-y-3`.
  - Các trường dài (như Địa chỉ): `col-span-2`.
- **Trạng thái lỗi (Validation):** 
  - Khung viền Input chuyển đỏ: `border-red-500/50 focus:ring-red-500`.
  - Dòng text lỗi: `text-[10px] text-red-500 mt-0.5`.

### 4.3. Panel Phải: Workflow & Tài chính (25%)
- **Mục đích:** Tóm tắt thông tin hồ sơ, trạng thái quy trình (Workflow) và dữ liệu tài chính (Thực nhận, Tỷ giá).
- **Header Thông tin thu gọn (Mini Profile):**
  - Flexbox ngang: `flex items-center gap-2 mb-3 pb-3 border-b border-white/10`.
  - Avatar: `w-10 h-10 rounded object-cover border border-white/20`.
  - Text: Tên `text-sm font-bold`, Mã/Quốc tịch `text-xs text-gray-400`.
- **Lưới Trạng thái Workflow:**
  - Tiêu đề: "Trạng thái xử lý" (`text-xs font-semibold mb-1`).
  - Nút trạng thái dạng lưới (Button Grid): `grid grid-cols-2 gap-1`.
  - Nút mặc định: `py-1 px-1 text-[10px] text-center rounded border border-gray-500/30 hover:bg-white/5 cursor-pointer transition-colors`.
  - Nút Active (đang kích hoạt): Bọc viền và nền nổi bật, ví dụ `bg-blue-500/20 border-blue-500 text-blue-400`.
- **Các mốc ngày xử lý & Tài chính:**
  - Nhóm bằng các thẻ con (Sub-cards) nếu cần để tách biệt khu vực Ngày nộp/nhận và Tài chính.
  - Các Input nhập tiền (JPY) và tỷ giá thiết kế căn lề phải (right-aligned text) để dễ đọc số.
  - **Nút "Tính phí (20%)":** Chiều cao `h-8`, chữ `text-xs font-medium`, nền màu nhấn (ví dụ `bg-emerald-600 hover:bg-emerald-500 text-white rounded w-full mt-2`).

## 5. Tóm tắt các class Tailwind quan trọng cần áp dụng
```css
/* Layout Tổng */
.layout-container { flex flex-row w-full h-[calc(100vh-64px)] gap-2 p-2 overflow-hidden }
.panel-base { flex flex-col min-h-0 h-full overflow-y-auto }

/* Glassmorphism */
.glass-panel { bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-3 }

/* High-Density Forms */
.form-label { text-xs text-gray-400 mb-0.5 block }
.form-input { h-8 py-1 px-2 text-xs w-full bg-black/20 border border-white/10 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none }

/* Action Buttons */
.btn-primary { h-8 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors }
.btn-sm-action { w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded }
```

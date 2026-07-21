TRẢ LỜI CỦA AN

# HƯỚNG DẪN THIẾT KẾ GIAO DIỆN (UI GUIDELINES)
**Dự án:** NenkinPro
**Giai đoạn:** Phase 1 Foundation Refactoring
**Phong cách:** Modern Minimalist Glassmorphism

Tài liệu này định nghĩa hệ thống thiết kế và các nguyên tắc UI/UX để đạt được giao diện theo phong cách **Modern Minimalist Glassmorphism**, đảm bảo sự đồng bộ và trải nghiệm người dùng cao cấp xuyên suốt ứng dụng NenkinPro.

---

## 1. BẢNG MÀU (COLOR PALETTE & TAILWIND TOKENS)

Phong cách Glassmorphism yêu cầu nền phía sau (App Background) phải có độ sâu hoặc một chút màu sắc (thường là mesh gradient hoặc màu pastel nhạt) để hiệu ứng mờ (blur) được thể hiện rõ ràng.

### 1.1. Màu Nền (Backgrounds)
- **App Background (Nền tổng thể):** Sử dụng dải gradient nhẹ nhàng để tôn hiệu ứng kính.
  - *Tailwind class:* `bg-gradient-to-br from-slate-100 to-blue-50/50`
- **Glass Surface (Bề mặt kính):** Màu nền bán trong suốt để kết hợp với backdrop-blur.
  - *Tailwind class:* `bg-white/40` (Light mode) đến `bg-white/60`.
- **Glass Border (Viền kính):** Viền sáng giúp tạo khối 3D mỏng cho lớp kính.
  - *Tailwind class:* `border-white/50` hoặc `border-white/70`.

### 1.2. Màu Chủ Đạo & Trạng Thái (Primary & State Colors)
- **Primary (Hành động chính):** Xanh dương hiện đại và đáng tin cậy.
  - *Text/Icon:* `text-blue-600`
  - *Button/Background:* `bg-blue-600 hover:bg-blue-700`
- **Success (Thành công - e.g. COMPLETED):** Xanh lá trong trẻo.
  - *Text:* `text-emerald-600`
  - *Badge/Tag:* `bg-emerald-500/10 border-emerald-500/20`
- **Warning (Cảnh báo - e.g. REVISION_REQUIRED):** Cam / Hổ phách.
  - *Text:* `text-amber-600`
  - *Badge/Tag:* `bg-amber-500/10 border-amber-500/20`
- **Error (Lỗi/Từ chối):** Đỏ dịu.
  - *Text:* `text-rose-500`
  - *State:* `border-rose-300 bg-rose-50/50`

### 1.3. Nghệ thuật chữ (Typography)
- **Tiêu đề chính (Headings):** Đậm, gọn gàng.
  - *Tailwind class:* `text-slate-800 font-semibold tracking-tight`
- **Văn bản thường (Body Text):** Dễ đọc, độ tương phản vừa đủ không quá gắt.
  - *Tailwind class:* `text-slate-600 text-base leading-relaxed`
- **Nhãn Form (Labels):** Rõ ràng, nhỏ nhắn.
  - *Tailwind class:* `text-slate-700 text-sm font-medium`

---

## 2. KHOẢNG CÁCH, BO GÓC & ĐỔ BÓNG (SPACING, BORDER-RADIUS & SHADOWS)

- **Bo góc (Border Radius):**
  - **Cards & Modals:** Bo góc lớn để tạo cảm giác mềm mại thân thiện. Dùng `rounded-2xl` (16px) hoặc `rounded-3xl` (24px).
  - **Buttons & Inputs:** `rounded-lg` (8px) hoặc `rounded-xl` (12px).
- **Đổ bóng (Shadows):** Shadows trong Glassmorphism cần đổ rộng và mượt, tạo chiều sâu tách biệt lớp kính với nền dưới.
  - **Modals/Floating elements:** `shadow-[0_8px_30px_rgb(0,0,0,0.08)]` (hoặc `shadow-xl`).
  - **Cards:** `shadow-sm` hoặc `shadow-md` với opacity của shadow rất thấp.
- **Khoảng cách (Spacing):** Thiết kế High-Density ưu tiên sự nhỏ gọn, tiết kiệm diện tích thay vì các khoảng trắng lớn.
  - Sử dụng khoảng cách nhỏ từ `p-2` đến `p-4` cho các Cards.
  - Khoảng cách giữa các section: `gap-2` đến `gap-4`, `space-y-2` đến `space-y-4`.

---

## 3. COMPONENT MẪU (GLASSMORPHISM EXAMPLES)

### 3.1. Glassmorphism Card (Cho hiển thị chi tiết hoặc danh sách Mobile)

```tsx
<div className="relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_4px_24px_rgb(0,0,0,0.04)] rounded-xl p-4 transition-all hover:bg-white/50">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-slate-800">Thông tin Khách Hàng</h3>
    <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50/50 border border-blue-100/50 rounded-full">
      SENT_1ST
    </span>
  </div>
  <div className="space-y-2">
    <p className="text-sm text-slate-600">
      <span className="font-medium text-slate-700">Họ và tên:</span> Nguyễn Văn A
    </p>
    <p className="text-sm text-slate-600">
      <span className="font-medium text-slate-700">Mã Nenkin:</span> 1234-5678-9012
    </p>
  </div>
</div>
```

### 3.2. Glassmorphism Modal (Form cập nhật trạng thái)

```tsx
{/* Backdrop/Overlay có hiệu ứng blur nhẹ và màu tối */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
  
  {/* Glass Modal Box */}
  <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgb(0,0,0,0.1)] rounded-3xl p-8">
    <h2 className="text-xl font-semibold tracking-tight text-slate-800 mb-2">
      Yêu cầu bổ sung hồ sơ
    </h2>
    <p className="text-sm text-slate-500 mb-6">
      Nhập lý do cần sửa đổi (Revision Note) để khách hàng cập nhật.
    </p>

    {/* Form Inputs Here */}
    <div className="flex justify-end gap-3 mt-8">
      <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white/50 hover:bg-white/80 border border-slate-200/50 rounded-xl transition-colors">
        Hủy bỏ
      </button>
      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
        Xác nhận
      </button>
    </div>
  </div>
</div>
```

---

## 4. UI/UX CHO XÁC THỰC DỮ LIỆU (INLINE FORM VALIDATION ERRORS)

Để mang lại trải nghiệm người dùng hiện đại và trơn tru, việc phản hồi lỗi khi nhập liệu (Form Validation) sử dụng `zod` và `react-hook-form` sẽ tuân theo các quy tắc UI sau:

### 4.1. Cơ chế hoạt động (Behavior)
- **Real-time Feedback:** Kích hoạt validation ngay khi người dùng rời khỏi field (`mode: "onBlur"`) hoặc đang thay đổi khi field đã có lỗi (`mode: "onChange"`). Tránh báo lỗi toàn bộ form ngay khi người dùng chưa kịp gõ.
- **Vị trí lỗi (Inline Placement):** Thông báo lỗi luôn xuất hiện ngay bên dưới ô input bị lỗi, cách mép dưới input một khoảng `mt-1.5`.

### 4.2. Giao diện báo lỗi (Error UI)
- **Input Field khi có lỗi:**
  - Viền đổi sang màu đỏ mờ: `border-rose-400 focus:border-rose-500 focus:ring-rose-500/20`.
  - Nền input đổi sang sắc đỏ nhạt trên kính: `bg-rose-50/40`.
- **Dòng thông báo lỗi (Error Message Text):**
  - Sử dụng cỡ chữ nhỏ: `text-sm text-rose-500 font-medium`.
  - Cần có icon cảnh báo (ví dụ: ExclamationCircle của Heroicons) đặt cạnh text để tăng sự chú ý mà không gây khó chịu.
  - Sử dụng Animation: Cần có hiệu ứng trượt nhẹ (slide-down) hoặc fade-in nhanh (ví dụ: `animate-in fade-in slide-in-from-top-1 duration-200`) để thông báo lỗi xuất hiện tự nhiên, không làm giật nội dung (layout shift).

**Mẫu UI cho Field Lỗi:**
```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-slate-700">Ngày gửi lần 1</label>
  <input 
    type="date" 
    className="w-full px-4 py-2 bg-rose-50/40 border border-rose-400 text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
  />
  <div className="flex items-center gap-1.5 text-rose-500 animate-in fade-in slide-in-from-top-1">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <span className="text-sm font-medium">Bắt buộc nhập Ngày gửi khi chuyển sang SENT_1ST</span>
  </div>
</div>
```

---

## 5. CẤU TRÚC LAYOUT VÀ ĐIỀU HƯỚNG (LAYOUT & NAVIGATION)

### 5.1. Tích Hợp Không Gian Làm Việc (Workspace Integration)
- **Quản lý Hồ sơ:** Hợp nhất (Merge) hai phân hệ "Customers" và "Applications" thành một không gian làm việc duy nhất mang tên **"Quản lý Hồ sơ"**. Điều này giúp giảm thiểu việc chuyển đổi ngữ cảnh cho người dùng, cho phép theo dõi xuyên suốt từ thông tin cá nhân đến tiến độ giải quyết hồ sơ một cách mượt mà.

### 5.2. Hover-to-expand Mini-Sidebar
- Để tối đa hóa diện tích màn hình cho nội dung chính, thanh điều hướng (Sidebar) áp dụng cơ chế **Hover-to-expand**.
  - **Thu gọn (Collapsed):** Chỉ hiển thị các biểu tượng (icons) đại diện cho các phân hệ (Dashboard, HR, Finance, Settings, Tax Offices, v.v.). Chiều rộng nhỏ (vd: `w-16` hoặc `w-20`).
  - **Mở rộng (Expanded - Hover):** Khi người dùng di chuột lên, sidebar mở rộng một cách mượt mà (`transition-all duration-300 ease-in-out`), hiển thị đầy đủ tiêu đề của từng mục. Chiều rộng lớn (vd: `w-64`). Cần sử dụng `absolute z-50` hoặc cấu trúc phù hợp để Sidebar nổi lên trên hoặc đẩy nội dung nhẹ nhàng mà không phá vỡ layout.

### 5.3. Tính Đồng Nhất Toàn Cục (Absolute Visual Consistency)
- Cần đảm bảo tính đồng nhất tuyệt đối về thiết kế thị giác (khoảng cách, màu sắc, font chữ, các hiệu ứng shadow/blur, bo góc) trên toàn bộ cấu trúc dự án bao gồm: Dashboard, HR, Finance, Settings, Tax Offices. 
- Mọi thành phần đều tuân thủ chặt chẽ nguyên tắc Glassmorphism đã thiết lập (ở phần 1 và 2).

---

## 6. GIAO DIỆN CHI TIẾT HỒ SƠ (PROFILE DETAIL LAYOUT)

Giao diện xem chi tiết hồ sơ khách hàng sẽ được tối ưu hóa đặc biệt cho màn hình Desktop (nhằm mục đích dễ dàng nhập liệu và đối chiếu thông tin).

### 6.1. Cấu Trúc Trái/Phải (Left/Right Grid)
Sử dụng hệ thống lưới `grid-cols-12` để phân bố nội dung trên màn hình lớn:
- **Cột Trái (Left Panel - Documents):** Chiếm **5 cột (`col-span-5`)**. Đây là khu vực cố định chứa thông tin khách hàng, hình ảnh giấy tờ (Thẻ ngoại kiều, Hộ chiếu, Sổ tay Nenkin), tài liệu đính kèm.
- **Cột Phải (Right Panel - State Flow):** Chiếm **7 cột (`col-span-7`)**. Khu vực này có thể cuộn, tập trung vào luồng trạng thái (State Flow), các form nhập liệu, ghi chú, và lịch sử thực hiện (Timeline) của hồ sơ.
- *Tailwind class gợi ý:* `<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">`

### 6.2. Trình Xem Ảnh Phóng To (Image Lightbox)
- Để phục vụ cho việc đọc thông tin từ giấy tờ đính kèm dễ dàng, hệ thống sẽ sử dụng **Image Lightbox** khi xem ảnh.
  - **Kích hoạt:** Nhấn vào ảnh thumbnail bất kỳ tại Cột Trái.
  - **Giao diện (UI):** Popup nổi phủ kín màn hình (`fixed inset-0 z-[100]`), sử dụng nền đen làm mờ nhẹ (`bg-black/80 backdrop-blur-sm`).
  - **Tính năng (UX):** Ảnh được hiển thị to rõ giữa màn hình (`flex items-center justify-center`). Có một nút Đóng (Close - X) lớn, màu trắng nằm ở góc trên bên phải. Nếu cần thiết có thể tích hợp tính năng Zoom in/out hoặc xoay ảnh.
  - *Ví dụ Container Lightbox:* `<div className="relative max-w-5xl w-full h-auto max-h-[90vh]">`

---

## 7. THIẾT KẾ ĐÁP ỨNG (RESPONSIVE DESIGN - MOBILE & DESKTOP)

Giao diện của NenkinPro được xây dựng theo triết lý **Responsive-by-default** (Mặc định tương thích mọi thiết bị). Mọi component, layout, và tương tác đều được thiết kế để tự động thay đổi uyển chuyển giữa màn hình rộng (Desktop) và màn hình hẹp (Mobile) mà không làm suy giảm trải nghiệm người dùng. Do đó, hệ thống đã hoàn toàn sẵn sàng cho cả hai nền tảng, **không cần thiết phải tuyển dụng thêm nhân sự chuyên trách UI/UX riêng cho mobile và desktop**.

### 7.1. Bố cục không gian làm việc (Split Workspace Layout)
- **Desktop (Màn hình lớn):** Sử dụng cấu trúc chia cột để tối đa hóa không gian và hiển thị đa luồng thông tin. Trang chi tiết hồ sơ dùng `md:grid-cols-12 md:flex-row` (ví dụ: 5 cột trái cho tài liệu, 7 cột phải cho luồng trạng thái).
- **Mobile (Màn hình nhỏ):** Các cột tự động chuyển thành cấu trúc xếp chồng dọc (Stacked vertically). Nội dung cuộn từ trên xuống dưới (ví dụ: Tài liệu nằm trên, trạng thái và form nhập liệu nằm dưới). Sử dụng `grid-cols-1` và `flex-col`.

### 7.2. Hiển thị danh sách dữ liệu (Data Lists & Tables)
- **Desktop:** Ưu tiên sử dụng **Bảng dữ liệu (Tables)** để hiển thị khối lượng lớn thông tin có cấu trúc, giúp người dùng dễ dàng so sánh, sắp xếp và quản lý hàng loạt.
- **Mobile:** Tự động chuyển đổi từ dạng Bảng sang **Dạng Thẻ (Cards)**. Mỗi hàng dữ liệu trên desktop sẽ trở thành một Card chứa các thông tin chính yếu trên mobile, tận dụng tối đa chiều rộng hữu ích và giúp dễ dàng thao tác bằng ngón tay.

### 7.3. Điều hướng (Navigation)
- **Desktop:** Sử dụng **Mini-Sidebar (Hover-to-expand)** đặt ở mép trái màn hình, tối ưu không gian hiển thị cho màn hình ngang.
- **Mobile:** Hệ thống tự động ẩn Sidebar ngang và thay thế bằng **Bottom Navigation Bar** (Thanh điều hướng dưới đáy màn hình) cho các chức năng truy cập nhanh nhất, kết hợp với **Hamburger menu** (Menu ẩn) ở góc trên để mở rộng các phân hệ còn lại, đảm bảo sự thân thiện khi cầm điện thoại bằng một tay.

---

## 8. NGUYÊN TẮC HIGH-DENSITY ENTERPRISE UI (GIAO DIỆN MẬT ĐỘ CAO)

Nhằm tối ưu hóa diện tích hiển thị và phục vụ cho nhu cầu xử lý khối lượng lớn công việc của hệ thống Enterprise, giao diện cần tuân thủ triết lý **High-Density**:

### 8.1. Tối ưu Không Gian (Spacing)
- **Hạn chế khoảng trắng thừa:** Không sử dụng padding/margin quá lớn như `p-6` hay `p-8` (ngoại trừ các Modal đặc biệt cần cảm giác thoáng đãng). Thay vào đó, dùng `p-2`, `p-3`, `p-4` để giữ giao diện sát nhau hơn nhưng vẫn duy trì độ rõ ràng.
- **Header & Tiêu đề:** Header của các trang hoặc các thẻ (Cards) phải được thiết kế dạng compact, chiều cao thấp, chứa đủ thông tin và nút thao tác cần thiết mà không chiếm dụng chiều cao màn hình.

### 8.2. Typography (Cỡ Chữ)
- Trong các danh sách (Lists), bảng biểu (Tables), và thẻ trạng thái, ưu tiên sử dụng cỡ chữ nhỏ `text-xs` hoặc `text-sm`.
- Tiêu đề phụ hoặc nhãn dán (Labels) có thể dùng `text-xs font-semibold uppercase tracking-wider` để phân biệt trực quan nhưng không tốn diện tích.

### 8.3. Thu gọn Thành phần Giao diện (Compact Components)
- **Mini-Ribbons thay cho Stat Cards:** Tránh sử dụng các Card thống kê (Dashboard Stat Cards) chiếm diện tích lớn. Hãy thiết kế chúng dưới dạng thanh ruy băng nhỏ (Mini-Ribbons), thanh ngang gộp (Inline stats), hoặc các badge trạng thái nhỏ gọn nằm trên đầu danh sách.
- **Bảng (Tables) mật độ cao:** Các hàng (Rows) trong bảng nên có padding `py-2` hoặc `py-1.5` để hiển thị được số lượng dòng tối đa trên một màn hình, giảm việc phải cuộn trang liên tục.


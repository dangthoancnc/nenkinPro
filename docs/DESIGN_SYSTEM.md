# QUY CHUẨN THIẾT KẾ GIAO DIỆN HỆ THỐNG (DESIGN SYSTEM STANDARDS)
**Dự án**: NenkinPro Enterprise System
**Phiên bản**: 1.0 (Mobile Native App & High-Density Desktop)

---

## 🎨 1. QUY ĐỊNH BẢNG MÀU (COLOR PALETTE)

### Core Theme Colors
- **Primary Accent**: `bg-indigo-600` / `text-indigo-600` / `border-indigo-200` (Hover: `indigo-700`)
- **Secondary Accent**: `bg-blue-600` / `text-blue-600`
- **Background Root**: `bg-gradient-to-br from-slate-100 to-blue-50/50`
- **Card Background**: Glassmorphism (`bg-white/85 backdrop-blur-md border border-slate-200/70 shadow-lg shadow-black/5 rounded-xl`)

### Status Colors (Trạng thái Hồ sơ)
| Status Code | Tên trạng thái | Màu Badge Tailwind |
|---|---|---|
| `DRAFT` | Bản nháp | `bg-amber-50 text-amber-700 border-amber-200` |
| `PENDING` | Cần duyệt | `bg-orange-50 text-orange-700 border-orange-200` |
| `SENT_1ST` | Đã nộp (Lần 1) | `bg-blue-50 text-blue-700 border-blue-200` |
| `RECEIVED_1ST` | Đã nhận (Lần 1) | `bg-indigo-50 text-indigo-700 border-indigo-200` |
| `SENT_2ND` | Đã nộp (Lần 2) | `bg-purple-50 text-purple-700 border-purple-200` |
| `RECEIVED_2ND` | Đã nhận (Lần 2) | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| `COMPLETED` | Hoàn thành | `bg-emerald-100 text-emerald-800 border-emerald-300` |
| `CANCELLED` | Đã hủy | `bg-red-50 text-red-700 border-red-200` |

---

## 📐 2. QUY ĐỊNH PHÔNG CHỮ & CỠ CHỮ (TYPOGRAPHY SCALE)

### Font Families
- **Văn bản & Tiêu đề**: `Be Vietnam Pro`, Inter, system-ui (`font-sans`)
- **Mã số, Tiền tệ, Ngày tháng**: `JetBrains Mono`, monospace (`font-mono`)

### Typography Sizes
| Vai trò | Tailwind Class | Kích thước | Styling |
|---|---|---|---|
| **Page Title** | `text-lg sm:text-xl` | 18px / 20px | `font-bold text-slate-900 tracking-tight` |
| **Section Title** | `text-sm sm:text-base` | 14px / 16px | `font-bold text-slate-800` |
| **Subsection / Card Title** | `text-xs sm:text-sm` | 12px / 14px | `font-bold text-slate-700` |
| **Body / Label** | `text-xs` | 12px | `font-medium text-slate-700` |
| **Caption / Badge** | `text-[10px]` / `text-[11px]` | 10px / 11px | `font-semibold text-slate-500` |
| **Numeric / Currency** | `font-mono text-xs sm:text-sm` | 12px / 14px | `font-bold text-slate-900` |

---

## 📱 3. QUY ĐỊNH GIAO DIỆN MOBILE NATIVE APP (< 1024px)

1. **Khung Viewport (Zero Horizontal Scroll)**:
   - Tất cả container trang phải áp dụng: `max-w-full overflow-x-hidden pb-20 md:pb-0`
   - Tuyệt đối không cho phép trang web có thanh cuộn ngang ngoài ý muốn (`html, body { overflow-x: hidden; max-width: 100vw; }`).

2. **Thanh Bottom Navigation (`BottomNavigationBar.tsx`)**:
   - Vị trí: Cố định ở `fixed bottom-0 left-0 right-0 z-50 h-14 bg-white/95 backdrop-blur-md`
   - Hiển thị: 6 mục điều hướng cốt lõi với biểu tượng gọn gàng và nhãn chữ `text-[9px] truncate`.

3. **Chế độ xem Thẻ Card trên Mobile**:
   - Danh sách bảng trên Mobile mặc định chuyển sang dạng Thẻ Card di động (Mobile Card View) có bố cục gọn, khoảng cách nhỏ (`p-2.5 sm:p-3`), nút thao tác chạm nhanh vừa ngón tay (`min-h-[36px]`).
   - Nếu chọn chế độ Bảng, bảng phải bọc trong `w-full overflow-x-auto min-w-[600px]` co giãn cuộn ngang mượt mà.

---

## 🖥️ 4. QUY ĐỊNH GIAO DIỆN DESKTOP (≥ 1024px)

1. **Bố cục Flex & Grid**:
   - Sử dụng các breakpoint `md:` và `lg:` để mở rộng tự động từ 1 cột (Mobile) sang 2 - 4 cột (Desktop).
   - Layout Chi tiết Hồ sơ: Left Panel (35% width, full height), Middle Panel (col-span-5), Right Panel (col-span-3), Tax Panel span full Col 2 bên dưới.

2. **Mật độ Thông tin (High-Density UI)**:
   - Sử dụng padding vừa phải (`p-3 sm:p-4`), cỡ chữ nhỏ gọn nhưng rõ nét để hiển thị tối đa dữ liệu mà không cần cuộn trang nhiều lần.

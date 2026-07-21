# Quyết định Kiến trúc (Architecture Decisions) - Giai đoạn 3

Tài liệu này mô tả các quyết định kiến trúc kỹ thuật để refactor trang Chi tiết Hồ sơ (`/applications/[id]`) thành giao diện 3-panel độc lập theo `PRD_Phase3.md`.

## 1. Kiến trúc React Component (Phân chia `page.tsx`)
Để tránh tình trạng file `page.tsx` trở nên quá lớn (monolithic) và khó bảo trì, giao diện sẽ được chia nhỏ thành các Component độc lập đảm nhận nhiệm vụ riêng biệt:

*   **`ApplicationDetailPage` (Server Component):** Nằm tại `app/applications/[id]/page.tsx`. Đảm nhiệm việc fetch dữ liệu ban đầu từ Database thông qua Server-Side Rendering (SSR) để tối ưu tốc độ load. Sau đó truyền `initialData` xuống cho Client Component.
*   **`ApplicationDetailClient` (Client Component):** Component bọc ngoài (Wrapper) quản lý Layout 3 cột (`h-[calc(100vh-header)]`, `flex`, `flex-row`, `gap-x-2`). Đây cũng là nơi khởi tạo Root Form (`FormProvider`).
*   **Thư mục `components/ApplicationDetails/`:**
    *   `LeftPanel.tsx`: Quản lý hiển thị danh sách Tabs tài liệu, Trình xem ảnh (Image Viewer), và Floating Toolbar (Upload/Delete/Zoom).
    *   `MiddlePanel.tsx`: Là một "Contextual Form Container". Nhiệm vụ chính là dựa vào state của Tab đang chọn để render ra các Sub-form nhập liệu tương ứng (`ZairyuCardForm`, `PassportForm`, `NenkinForm`, `BankForm`).
    *   `RightPanel.tsx`: Hiển thị Header thông tin tóm tắt khách hàng, lưới nút bấm chọn Trạng thái (Workflow), các input về mốc thời gian, và các form tính toán Tài chính (Tỷ giá, Tính phí dịch vụ 20%).

**Quy tắc UI chung cho High-Density Layout:** Mỗi Panel phải được thiết kế thành một container có thuộc tính `flex-1`, `flex-col`, `min-h-0`. Vùng chứa nội dung bên trong bắt buộc sử dụng `overflow-y-auto` để đảm bảo cuộn độc lập (Independent Scroll), không làm cuộn màn hình tổng thể.

## 2. Quản lý Trạng thái UI (State Management)
**Vấn đề:** Panel Trái (chọn Tab loại tài liệu) quyết định việc Panel Giữa hiển thị Component Form nào. Nếu lưu biến trạng thái `activeTab` ở Component cha (`ApplicationDetailClient`), mỗi lần chuyển Tab sẽ kích hoạt re-render toàn bộ trang (bao gồm cả Panel Phải rất nặng), gây giảm hiệu suất nghiêm trọng.

**Giải pháp Kiến trúc:**
*   Sử dụng thư viện **Zustand** để tạo một UI Store nhỏ gọn (`useApplicationUIStore`).
*   Store này chuyên quản lý các Global UI State không liên quan đến dữ liệu cần gửi đi của form. Ví dụ: `activeTab` (chuỗi định danh tab đang mở), `isImageZoomed` (trạng thái xem ảnh phóng to).
*   **Luồng hoạt động:** 
    1. `LeftPanel` gọi hàm `setActiveTab` trong Store khi User nhấn vào một tab tài liệu.
    2. `MiddlePanel` subscribe (lắng nghe) biến `activeTab` từ Zustand Store để switch Form Component tương ứng.
*   **Kết quả:** Tránh được Prop Drilling. Khi người dùng chuyển Tab, chỉ có `LeftPanel` (cập nhật style tab active) và `MiddlePanel` (đổi form nhập liệu) bị re-render. Component cha và `RightPanel` hoàn toàn không bị ảnh hưởng, giữ được tính mượt mà của ứng dụng.

## 3. Quản lý Form (Form Management)
**Vấn đề:** Dữ liệu cần thu thập để lưu lại nằm rải rác ở cả 3 Panel (URL ảnh ở Panel Trái, Dữ liệu khách hàng ở Panel Giữa, Trạng thái hồ sơ & Dòng tiền ở Panel Phải). Cần một cơ chế thu thập dữ liệu tập trung, validate chặt chẽ theo từng trường và không gây giật lag khi gõ văn bản dài.

**Giải pháp Kiến trúc:**
*   Sử dụng **`react-hook-form` (RHF) kết hợp với `zod`** để schema validation ở mức Component cha (`ApplicationDetailClient`).
*   **Thiết lập FormProvider:** 
    * Khởi tạo form: `const methods = useForm({ defaultValues, resolver: zodResolver(applicationSchema) })`.
    * Bọc toàn bộ layout 3 Panel bằng `<FormProvider {...methods}>`.
*   **Sử dụng tại các Panels (`useFormContext`):**
    *   **Panel Trái:** Không trực tiếp nhập liệu văn bản, nhưng khi Upload ảnh thành công, gọi `methods.setValue('documents.zairyu_front_url', url, { shouldDirty: true })` để lưu link ảnh vào RHF state.
    *   **Panel Giữa:** Render các `input` sử dụng uncontrolled behavior thông qua `register('fieldName')`. Điều này giúp RHF cô lập các lần re-render, khi gõ phím sẽ không làm toàn bộ form hoặc các Panel khác bị vẽ lại.
    *   **Panel Phải:** Đăng ký các field cho Workflow và Tài chính. Chức năng tính toán như nút "Tính phí (20%)" sẽ lấy giá trị bằng `methods.getValues()`, tính bằng Javascript, sau đó cập nhật kết quả tự động vào field phí thông qua `methods.setValue()`.
*   **Submit & Validation:** Nút "Save" tổng sẽ gọi `methods.handleSubmit(onSubmit)`. Dữ liệu từ cả 3 khu vực được RHF validate thông qua `zod` schema, tạo thành 1 payload JSON hợp nhất và gửi đi qua `PUT /api/applications/[id]`. Cấu trúc này đảm bảo tính nhất quán (Single Source of Truth) cho dữ liệu form mà không hy sinh hiệu suất hiển thị.

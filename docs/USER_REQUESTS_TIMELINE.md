# Dòng Thời Gian và Tổng Hợp Chi Tiết Yêu Cầu Người Dùng - Dự Án Nenkin
*Thời gian tổng hợp: 20/07/2026*

Tài liệu này tổng hợp toàn bộ các yêu cầu của người dùng từ ngày 17/07/2026 đến ngày 20/07/2026 được trích xuất và phân tích từ lịch sử hội thoại `conversation_history.md`. Tài liệu này đóng vai trò là **Single Source of Truth** để định hướng khôi phục và phát triển tiếp dự án Nenkin.

---

## 📅 CHI TIẾT THEO DÒNG THỜI GIAN

### 1. Ngày 17/07/2026 (Từ Bước 0 đến Bước 293)
*Giai đoạn khởi động, tái cấu trúc ban đầu và định hình giao diện hệ thống.*

*   **Review & Thiết lập Quy trình:**
    *   Sử dụng quy trình `agile_flow` để đánh giá tiến độ và cấu trúc lại hệ thống (DB, UI, Nghiệp vụ).
    *   **Yêu cầu bắt buộc:** Sử dụng tiếng Việt cho toàn bộ tài liệu thiết kế và `Implementation Plan`.
*   **Tiêu chuẩn Giao diện & Trải nghiệm (UI/UX):**
    *   Kiểm tra giao diện toàn diện, đảm bảo tính nhất quán trên toàn bộ mã nguồn.
    *   **Quy tắc High-Density UI:** Thiết kế tương thích song song cho cả **Mobile và Desktop**.
    *   Thu gọn các phần badge thống kê dư thừa ở phía trên màn hình để tiết kiệm không gian hiển thị (tránh lãng phí diện tích viewport).
    *   **Search Global:** Xây dựng thanh tìm kiếm chung cho tất cả các trang, loại bỏ ô tìm kiếm riêng lẻ.
    *   **Bộ lọc danh sách:** Hoàn thiện bộ lọc hồ sơ theo Tên, Ngày sinh, Trạng thái, Ngày gửi hồ sơ, hoặc thông tin Ngân hàng.
*   **Quản lý Hồ sơ & Thao tác:**
    *   Thêm tính năng chỉnh sửa/xóa hồ sơ kèm popup xác nhận trước khi thực hiện.
    *   **Nghiệp vụ Xem/Sửa:** Chế độ mặc định là Xem hồ sơ. Khi cần chỉnh sửa, người dùng bấm nút "Sửa" để chuyển sang chế độ Chỉnh sửa, và bấm "Lưu" để hoàn tất. Không dùng nút Hủy để đóng trang một cách tùy tiện.

---

### 2. Ngày 18/07/2026 (Từ Bước 327 đến Bước 2068)
*Tập trung thiết kế trang Chi tiết hồ sơ (3 Panel), tích hợp Supabase và xử lý nghiệp vụ Cục thuế.*

*   **Liên kết & Dữ liệu:**
    *   Duyệt qua tất cả sidebar và liên kết, đảm bảo không có link hỏng hoặc hardcode dữ liệu giả.
    *   Chuyển đổi hoàn toàn từ Mock data sang **Dữ liệu thật kết nối Supabase**.
    *   Thay thế Photobucket bằng **Supabase Storage** để lưu trữ tài liệu ảnh (an toàn, RLS policy theo `customer_id`, cấu trúc đường dẫn rõ ràng: `customer-documents/{customer_id}/{document_type}/{filename}`).
*   **Tái cấu trúc Layout Chi tiết Hồ sơ (3 Panel Layout):**
    *   **Panel Trái (Tài liệu/Hình ảnh):** Cho phép xem tài liệu ảnh gốc, cuộn độc lập. Tích hợp tính năng kéo thả hoặc bấm để tải ảnh mới lên, xóa hoặc sửa ảnh.
    *   **Panel Giữa (Form Nhập liệu):** Chứa các form tương ứng với ảnh tài liệu đang xem bên trái. Tất cả các trường thông tin phải hiển thị gọn trong viewport, không được cuộn trang chính.
    *   **Panel Phải (Thông tin Khách hàng & Trạng thái):**
        *   *Nửa trên:* Hiển thị thumbnail thẻ ngoại kiều (fit ảnh, không bị cắt xén) và các thông tin cá nhân cơ bản.
        *   *Nửa dưới:* Thông tin tiến độ hồ sơ, các trường cần điền. Tất cả nằm trọn trong viewport.
        *   *Dưới cùng:* Một mục riêng biệt hiển thị **Thông tin Cục thuế quản lý** để người dùng dễ dàng theo dõi từ bất kỳ tab nào.
*   **Quy trình Xác thực & Lưu trữ (OCR & Trạng thái):**
    *   Cho phép lưu hồ sơ ở bất kỳ trạng thái nào (gán nhãn cảnh báo nổi bật "Bản nháp/Đang nhập" trên đầu trang nếu thiếu thông tin), không chặn lưu khi các trường bị trống.
    *   **Xác nhận đối chiếu từng trường (AI Verification):** Cung cấp checkbox tích chọn bên cạnh mỗi trường thông tin được trích xuất từ AI để người dùng xác nhận bằng mắt. Khi tất cả các trường đã được tích xanh, hệ thống **tự động chuyển trạng thái sang "Đã duyệt"**, không cần bấm nút phê duyệt tổng.
    *   Khi bấm nút trích xuất AI lần thứ 2 trên cùng một ảnh, cần hiển thị popup xác nhận để tránh tốn phí API.
*   **Nghiệp vụ Cục thuế quản lý:**
    *   Liên kết mã bưu điện và địa chỉ khách hàng với nút mở bản đồ/vị trí.
    *   Thêm nút **Tra cứu bưu cục thuế** từ mã bưu điện khách hàng. Khi bấm, tự động mở trang web của Tổng cục Thuế Nhật Bản `https://www.nta.go.jp/about/organization/access/map.htm` và điền sẵn mã bưu điện.
    *   *So sánh Cục thuế (2 Cột):* Ở chế độ Xem/Sửa, hiển thị thông tin cục thuế thành 2 phần: Bên trái là thông tin thực tế tra cứu từ web, bên phải là thông tin trong DB. Nếu khác biệt thì tô màu cam/đỏ cảnh báo và hiển thị nút **"Đồng bộ dữ liệu"**. Biểu thị badge đánh dấu nếu cục thuế đã có sẵn trong danh sách DB để tránh tạo mới trùng lặp.
*   **Thiết kế popup In biểu mẫu:**
    *   Không mở trang in mới hoàn toàn. Hiển thị trang in dưới dạng **Popup Overlay** mượt mà, fit với viewport, cho phép phóng to/thu nhỏ và loại bỏ sidebar của hệ thống.

---

### 3. Ngày 19/07/2026 (Từ Bước 2153 đến Bước 5487)
*Tối ưu hóa UI danh sách, quản lý nhiều tài khoản Ngân hàng, cấu hình in ấn chi tiết và dọn dẹp DB.*

*   **Tối ưu Giao diện Danh sách (Dashboard/List):**
    *   Khắc phục lỗi tải chậm bằng cách áp dụng **Lazyloading và Phân trang**.
    *   Thêm cột thumbnail hiển thị ảnh thẻ ngoại kiều fit tỉ lệ.
    *   Hỗ trợ chế độ hiển thị linh hoạt: **Dạng Thẻ (Grid)** và **Dạng Bảng (Table)**.
    *   *Dạng Bảng:* Bổ sung các cột: Tên cục thuế, tên ngân hàng. Cho phép click vào tên khách hàng để mở nhanh chi tiết.
*   **Nghiệp vụ thông tin Ngân hàng:**
    *   Hỗ trợ một khách hàng có **nhiều tài khoản ngân hàng** (dùng cho lần 1, lần 2 hoặc dùng chung).
    *   Giao diện form nhập liệu ngân hàng: mặc định hiển thị 1 tài khoản, có nút **"+"** để thêm tài khoản mới. Nếu chọn loại tài khoản dùng "Chung" thì vô hiệu hóa tài khoản còn lại.
    *   Hỗ trợ tài khoản tại Nhật Bản (yêu cầu tên Katakana) hoặc Việt Nam (tái sử dụng thông tin ngân hàng/chi nhánh như tên, mã Swift, địa chỉ cho các khách hàng khác nhau).
    *   Mỗi tài khoản ngân hàng cho phép tải lên nhiều ảnh (hóa đơn, sổ...) và quản lý theo dạng tab ảnh tương ứng.
*   **Dọn dẹp DB & Khắc phục lỗi:**
    *   Dọn dẹp database schema, loại bỏ các bảng thừa thãi, tối ưu hóa mối quan hệ.
    *   Đảm bảo cơ chế: Khi xóa hồ sơ khách hàng, **xóa đồng thời tất cả hình ảnh liên quan** trên Supabase Storage.
    *   Khắc phục lỗi build khi di chuyển dự án sang máy tính khác (lỗi `prisma/build/index.js`).
*   **Chức năng Cấu hình & In biểu mẫu chi tiết:**
    *   Phân chia các tài liệu in ấn riêng biệt cho Lần 1 và Lần 2:
        *   **Lần 1:** Đơn xin (nhiều trang), Giấy ủy quyền lần 1, Ảnh thẻ ngoại kiều (gộp mặt trước + mặt sau trên 1 trang in), Ảnh hộ chiếu, Sổ ngân hàng, Giấy xác nhận thông tin ngân hàng (hỗ trợ nhiều ảnh), Ảnh chụp trang hộ chiếu có dấu xuất cảnh.
        *   **Lần 2:** Đơn xin lần 2 (tờ 1, 2 chung một file), Đơn xin lần 2 (tờ 3), Giấy ủy quyền lần 2, Ảnh thẻ ngoại kiều mặt trước/sau gộp chung.
    *   Thêm nút **In Tổng hợp** cho phép in tất cả tài liệu của Lần 1 hoặc Lần 2 bằng một lần click.
    *   Đồng bộ 100% tọa độ in giữa trang cấu hình và trang in thực tế. Loại bỏ dữ liệu mẫu hardcode "NGUYEN VAN A".
    *   *Thao tác tag in:* Cho phép dùng chuột quét chọn nhiều tag cùng lúc để di chuyển hoặc xóa hàng loạt. Dùng phím `Delete` trên bàn phím để xóa nhanh tag. Click đúp (double click) mới được phép chỉnh sửa nội dung bên trong tag.
    *   *Đơn xin lần 1:* Chuyển dấu khoanh tròn ở mục "Vĩnh trú" thành dấu check (`✓`). Thêm trường loại hình bảo hiểm tham gia vào DB (mặc định là bảo hiểm lấy nenkin bằng tiếng Nhật).
    *   *Trường ngày tháng:* Đổi tên "Ngày nộp" thành "Ngày gửi". Bổ sung trường nhập "Ngày viết đơn lần 1". Hiển thị chi tiết thông số kích thước font chữ, tên biến gốc và tên dịch nghĩa tiếng Việt trong popup chỉnh sửa tag.

---

### 4. Ngày 20/07/2026 (Từ Bước 5576 đến Bước 8133)
*Bổ sung các trường ngày tháng, trích xuất hộ chiếu/sổ nenkin bằng AI, tối ưu hóa Cục thuế và Sự cố Rollback mã nguồn.*

*   **Logic ngày tháng & Đồng bộ ảnh:**
    *   Thêm trường **Ngày xuất cảnh** (lấy từ dấu xuất cảnh hộ chiếu).
    *   Cảnh báo màu cam nổi bật nếu ngày viết đơn hoặc ngày gửi có giá trị sớm hơn ngày xuất cảnh (vì ngày xuất cảnh phải là sớm nhất).
    *   Mặc định khung crop ảnh hiển thị full (không cắt xén) khi vừa tải lên.
    *   Tránh tự động lưu ảnh vào DB mỗi lần tải lên mà chưa lưu hồ sơ để ngăn ngừa trùng lặp ảnh rác.
*   **Nghiệp vụ AI nâng cao:**
    *   **Trích xuất Hộ chiếu:** Trích xuất Họ tên, Giới tính, Số hộ chiếu, Ngày cấp, Ngày hết hạn và tự động chuẩn hóa sang định dạng của Việt Nam.
    *   **Trích xuất Sổ Nenkin:** Tìm mã số dạng `1234-567891` xung quanh từ khóa `年金番号` để tránh nhiễu thông tin.
*   **Nghiệp vụ Cục thuế nâng cao:**
    *   *Địa chỉ nhận hồ sơ:* Sửa logic tra cứu trên web nta.go.jp. Khi tìm kiếm bằng mã bưu điện, AI cần tự động click vào nút **"ひらく"** (hoặc mở rộng mục `詳細情報`) để lấy đúng thông tin địa chỉ gửi thư/hồ sơ tại mục **"申告書等の郵送先"** (nơi tiếp nhận hồ sơ thực tế là các trung tâm xử lý nghiệp vụ - 業務センター).
*   **Trang Chi tiết Hồ sơ & Tác vụ Độc lập:**
    *   Tách nút Lưu riêng biệt cho từng nhóm thông tin (Lưu thông tin cá nhân, lưu ngân hàng, lưu cục thuế...) để người dùng chỉnh sửa độc lập mà không ảnh hưởng lẫn nhau.
    *   Bổ sung **Tab Thông tin liên quan** ở panel trái để lưu ảnh tài liệu tự do và trường ghi chú chat với khách hàng.
*   **🚨 SỰ CỐ ROLLBACK MÃ NGUỒN (Critical):**
    *   Mã nguồn bị tự động git pull hoặc khôi phục từ backup cũ làm mất toàn bộ các tính năng đã phát triển hoàn thiện trước đó.
    *   **Yêu cầu cấp bách:** Kiểm tra lịch sử thay đổi để khôi phục mã nguồn về trạng thái mới nhất có đầy đủ các cập nhật trên.
    *   **Quy tắc tối cao:** Tuyệt đối không tự động tải mã nguồn từ github hoặc dùng backup cũ đè lên code hiện tại khi chưa có sự xác nhận của người dùng. Nếu gặp lỗi phải dừng lại để yêu cầu hướng dẫn.

---

## 📌 DANH SÁCH CÁC TÍNH NĂNG CẦN KHÔI PHỤC & KIỂM TRA NGAY
Dưới đây là các tính năng đã từng được phát triển thành công nhưng bị mất do sự cố rollback:

1.  **Giao diện Danh sách:** Chế độ hiển thị dạng bảng (Table) / dạng thẻ (Grid), có thumbnail ảnh thẻ ngoại kiều fit tỉ lệ, phân trang và lazyloading.
2.  **Layout Chi tiết Hồ sơ:** Cấu trúc 3 Panel, tiêu đề chuyển lên header chính, thông tin Cục thuế tách riêng nằm ở góc dưới bên phải.
3.  **Thông tin Ngân hàng:** Quản lý nhiều tài khoản ngân hàng, có nút "+" thêm tài khoản mới, hỗ trợ tài khoản Nhật (tên Katakana) và tài khoản Việt Nam, cho phép tải nhiều ảnh cho mỗi tài khoản.
4.  **Cục thuế & NTA:** Tra cứu mã bưu điện cục thuế, lấy địa chỉ từ mục "申告書等の郵送先", hiển thị bảng đối chiếu 2 cột và nút "Đồng bộ dữ liệu" kèm cảnh báo màu cam.
5.  **Duyệt từng trường (AI Verification):** Cơ chế tích xanh từng trường thông tin trích xuất, tự động chuyển trạng thái "Đã duyệt" khi tích đầy đủ.
6.  **Trích xuất AI:** Trích xuất hộ chiếu đầy đủ thông tin (giới tính, số hộ chiếu, ngày cấp/hết hạn), trích xuất mã số Nenkin dạng `1234-567891`.
7.  **Quản lý Ảnh:** Crop ảnh tự do từng cạnh, mặc định full size, cho phép crop khi đang sửa, và cơ chế ghi đè ảnh cũ để tránh trùng lặp file rác.
8.  **In biểu mẫu:** Popup in overlay mượt mà không bị reload trang, in gộp mặt trước/mặt sau thẻ ngoại kiều, đơn xin lần 1 vĩnh trú chuyển thành dấu check `✓`.
9.  **Ngày tháng:** Nhập ngày tháng khóa năm 4 ký tự, hỗ trợ tự động nhận diện dạng ngày rút gọn `7/20`. Cảnh báo màu cam nếu ngày viết đơn trước ngày xuất cảnh.
10. **Tab Thông tin liên quan:** Tab bổ sung chứa ảnh tự do và văn bản ghi chú chat với khách hàng.

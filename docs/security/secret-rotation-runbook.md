# Runbook: Secret Rotation cho NenkinPro

Tài liệu này hướng dẫn các bước cần thiết để xoay vòng (rotate) các bí mật (secrets) và thông tin xác thực của hệ thống, đặc biệt là thông tin kết nối Cơ sở dữ liệu và API keys.

## 1. Xoay vòng (Rotate) Database Password trên Supabase
1. Đăng nhập vào trang quản trị Supabase.
2. Mở dự án **NenkinPro**.
3. Điều hướng tới **Project Settings** -> **Database**.
4. Tìm mục **Database password** và nhấn **Reset password**.
5. Nhập mật khẩu mới an toàn, độ dài tối thiểu 16 ký tự, có ký tự đặc biệt, hoặc sử dụng trình tạo mật khẩu.
6. Lưu lại mật khẩu này một cách an toàn trên trình quản lý mật khẩu (e.g. 1Password, Bitwarden). Tuyệt đối không chia sẻ qua chat hoặc file văn bản.
7. Lấy lại chuỗi kết nối (connection string) mới cho **Transaction (Direct URL)** và **Session (Pooler URL)**.

## 2. Cập nhật Environment cho Local, Staging và Production
### Local
1. Mở file `.env.local` trên máy của bạn (không commit file này).
2. Cập nhật các biến:
   - `DATABASE_URL` (Pooler URL mới)
   - `DIRECT_URL` (Direct connection URL mới)
3. Cập nhật các API key mới nếu có (Supabase anon key, Gemini API key).

### Staging và Production (Vercel)
1. Đăng nhập vào Vercel, mở dự án NenkinPro.
2. Điều hướng tới **Settings** -> **Environment Variables**.
3. Cập nhật các biến `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` cho từng môi trường (Preview, Production).
4. Nhấn **Save**.

## 3. Deploy lại và Verify (Xác minh)
1. Truy cập Vercel -> **Deployments**.
2. Chọn deployment mới nhất và nhấn **Redeploy** với các biến môi trường mới.
3. Sau khi redeploy thành công, truy cập vào trang web production/staging.
4. **Verify**:
   - Thử đăng nhập hoặc thực hiện một thao tác đọc/ghi cơ sở dữ liệu (ví dụ: tạo hồ sơ khách hàng mới, hoặc lấy danh sách).
   - Kiểm tra API logs xem có lỗi 401/403/500 liên quan đến xác thực không.
   - Thử tính năng sử dụng Gemini OCR để chắc chắn API key mới hoạt động.

## 4. Rollback (Khôi phục) khi Deploy lỗi
Nếu hệ thống gặp sự cố kết nối Database hoặc API bị lỗi sau khi rotate:
1. Đăng nhập lại vào Supabase và thực hiện đổi mật khẩu về lại mật khẩu cũ (nếu sự cố do ứng dụng không kịp nhận chuỗi kết nối). Hoặc nhanh chóng sửa các biến môi trường trên Vercel nếu có sai sót (copy thiếu ký tự, ...).
2. Nếu mã nguồn có thay đổi đi kèm gây lỗi, hãy mở Vercel -> **Deployments** -> Chọn bản deploy ổn định trước đó -> Nhấn **Promote to Production** hoặc **Redeploy** ngay lập tức để rollback.
3. Kiểm tra logs để phân tích nguyên nhân kết nối thất bại trước khi thử lại quá trình rotation.

## 5. Xác minh Key cũ đã bị vô hiệu hóa
1. Từ máy tính local (hoặc Terminal), thử chạy lệnh kết nối trực tiếp đến PostgreSQL bằng `DATABASE_URL` cũ. Lệnh phải trả về lỗi (Access Denied / Authentication Failed).
2. Tương tự, nếu bạn rotate Supabase API keys, hãy thực hiện một request cURL tới URL dự án bằng `anon_key` hoặc `service_role_key` cũ. Request phải trả về 401 Unauthorized.
3. Kiểm tra mã nguồn (dùng git history, logs, và GitHub secret scanning) để đảm bảo key cũ không vô tình bị lộ trước khi hoàn tất thủ tục.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:anti-crash-rules -->
# Quy tắc chống tràn bộ nhớ / treo máy (Windows)

Dự án này chạy trên Windows và sử dụng Next.js App Router. Để tránh lỗi văng server (ERR_CONNECTION_RESET) hoặc treo tiến trình do cạn kiệt RAM/CPU:
1. **Luôn giới hạn RAM Node.js:** Sử dụng `cross-env NODE_OPTIONS="--max-old-space-size=4096"` trong các lệnh `dev` và `build` ở package.json.
2. **Ép Webpack dùng 1 luồng:** Trong `next.config.ts`, phải có `experimental: { cpus: 1, memoryBasedWorkersCount: true }` nếu không dùng Turbopack.
3. **Tránh lỗi HMR WebSocket:** Chạy `next dev` với IPv4 cứng (`-H 127.0.0.1`) để tránh xung đột `::1` IPv6 làm browser bị reload vô tận (nháy logo).
<!-- END:anti-crash-rules -->

<!-- BEGIN:ai-and-editing-rules -->
# Quy tắc sử dụng mô hình AI (Gemini)
1. **Luôn sử dụng `gemini-2.5-flash`:** Tuyệt đối không dùng bí danh `gemini-flash-latest` hay các mô hình Search-enabled vì tài khoản cấp phát cho dự án này (Free Tier) sẽ báo lỗi 404/429/503 liên tục. 
2. **Số lần Retry:** Chỉ gọi retry tối đa 1-2 lần để tránh bị Google block IP/Quota. Cần lặp qua nhiều API keys nếu cần thiết thay vì đập liên tục vào 1 key.

# Quy tắc chỉnh sửa code "Kiểu phẫu thuật" (Surgical Edits)
1. **Chỉ sửa đúng trọng tâm:** Khi được yêu cầu chỉnh sửa một tính năng, HÃY tìm đúng dòng code cần sửa và CHỈ thay đổi đúng chỗ đó.
2. **Không phá vỡ cấu trúc cũ:** Tuyệt đối không xóa, viết lại (rewrite) toàn bộ file, hay vô tình thay đổi các đoạn logic không liên quan. Sử dụng công cụ `multi_replace_file_content` thay vì `write_to_file` (Overwrite) với các file đã có nội dung lớn.
<!-- END:ai-and-editing-rules -->

<!-- BEGIN:an-signature-rule -->
# Quy t?c ch? ky c?a AN
1. ? ??u m?i cau tr? l?i, AN ph?i luon luon b?t ??u b?ng dong ch?: TR? L?I C?A AN.
2. ? cu?i m?i cau tr? l?i, AN ph?i luon luon k?t thuc b?ng dong ch?: TR? L?I C?A AN.
<!-- END:an-signature-rule -->

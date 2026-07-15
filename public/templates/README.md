# public/templates/

Thư mục này chứa các file Word template (.docx) đã được gắn sẵn các thẻ `{{tag}}` theo đúng MAPPING_GUIDE.md.

## Danh sách file cần cung cấp

| File | Biểu mẫu | Trạng thái |
|---|---|---|
| `form1.docx` | 脱退一時金請求書 (Đơn xin hoàn tiền Nenkin) | ⚠️ CẦN UPLOAD |
| `form2.docx` | 委任状 (Giấy ủy quyền) | ⚠️ CẦN UPLOAD |
| `form3.docx` | 納税管理人届出書 (Giấy báo người đại diện nộp thuế) | ⚠️ CẦN UPLOAD |

## Cách chuẩn bị file .docx template

1. Mở file biểu mẫu gốc (.pdf) trong thư mục `public/tham_khao/`
2. Tạo file Word (.docx) tương ứng (có thể dùng Adobe Acrobat, LibreOffice, hoặc đánh lại từ đầu)
3. Chèn các thẻ `{{tag_name}}` vào đúng vị trí ô trống trên biểu mẫu (tham chiếu MAPPING_GUIDE.md)
4. Lưu file với tên `form1.docx` / `form2.docx` / `form3.docx`
5. Upload vào thư mục này

## Lưu ý quan trọng

- Tag phải nằm trong **cùng một run** của Word (không được bị split giữa các run)
- Font chữ trong file .docx phải hỗ trợ cả tiếng Việt lẫn tiếng Nhật (khuyến nghị: **MS Gothic**, **Noto Sans JP**, hoặc **Yu Gothic**)
- Sau khi upload, gọi API `/api/generate-doc` với `templateType: 'form1'` để kiểm tra
- File này (README.md) có thể xóa sau khi đã upload đủ 3 file .docx

## Test nhanh sau khi upload

```bash
curl -X POST http://localhost:3000/api/generate-doc \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "<id-tu-db>", "templateType": "form1"}' \
  --output test_output.docx
```

# Quy tắc tính thuế Nenkin (Phiên bản 1.0)
**Người lập:** AntiGravity Agent
**Ngày tạo:** 2026-07-17

> [!WARNING]
> Cần Business Owner hoặc kế toán thuế xác nhận các mức giảm trừ, thuế suất lũy tiến và công thức tính. Các tham số hiện tại được mô phỏng dựa trên luật thuế hưu trí Nhật Bản cơ bản nhưng có thể cần điều chỉnh theo đặc thù của Nenkin Lần 2 (Hoàn thuế thu nhập).

## 1. Đầu vào bắt buộc
Để tính toán thuế trả lại (Lần 2), hệ thống yêu cầu các trường dữ liệu sau phải hợp lệ:
- `totalExpectedJpy` (Tổng tiền Nenkin dự kiến nhận): Lấy từ form thông tin tài chính của khách hàng. Phải là số dương hợp lệ.
- `workHistories` (Quá trình làm việc): Từ danh sách công ty. Hệ thống sẽ tính số ngày làm việc dựa trên `startDate` và `endDate` để quy ra số năm (`workYears`). Yêu cầu tối thiểu phải > 0 ngày.

*Nếu thiếu bất kỳ trường nào, hệ thống sẽ trả về `null` cho các kết quả tính toán và báo lỗi "Chưa đủ dữ liệu để tính", tuyệt đối không hiển thị giá trị `0` mặc định.*

## 2. Các công thức tính (Đơn vị: JPY)

### 2.1. Thuế đã khấu trừ (Withheld Tax)
- **Công thức:** `Thuế đã khấu trừ = Tổng dự kiến nhận * 20.42%`
- **Quy tắc làm tròn:** Làm tròn xuống (Math.floor).

### 2.2. Mức giảm trừ hưu trí (Retirement Deduction)
- **Công thức:** `Giảm trừ = Số năm làm việc * 400,000 JPY`
- **Quy tắc làm tròn:** Số năm làm việc lẻ sẽ được làm tròn lên thành năm nguyên (VD: 1.2 năm -> 2 năm). Tối thiểu là 1 năm.

### 2.3. Thu nhập chịu thuế hưu trí (Taxable Retirement Income)
- **Công thức:** `Thu nhập chịu thuế = (Tổng dự kiến nhận - Mức giảm trừ hưu trí) / 2`
- Nếu tổng dự kiến nhận <= mức giảm trừ, Thu nhập chịu thuế = 0.
- **Quy tắc làm tròn:** Làm tròn xuống (Math.floor).

### 2.4. Tính Thuế phải nộp (Calculated Tax)
Sử dụng bảng thuế suất lũy tiến áp dụng cho `Thu nhập chịu thuế`:
- `Dưới 1,950,000`: 5%
- `1,950,000 ~ 3,300,000`: 10% - 97,500
- `3,300,000 ~ 6,950,000`: 20% - 427,500
- `6,950,000 ~ 9,000,000`: 23% - 636,000
- `9,000,000 ~ 17,999,000`: 33% - 1,536,000
- `18,000,000 ~ 39,999,000`: 40% - 2,796,000
- `Trên 40,000,000`: 45% - 4,796,000

*Thuế phải nộp cuối cùng (Final Calculated Tax)*: 
- **Công thức:** `Thuế lũy tiến cơ bản * 1.021` (Cộng thêm 2.1% thuế phục hồi thu nhập).
- **Quy tắc làm tròn:** Làm tròn xuống.

### 2.5. Số tiền hoàn lại (Refund Amount)
- **Công thức:** `Hoàn thuế = Thuế đã khấu trừ (2.1) - Thuế phải nộp (2.4)`

## 3. Các trường hợp ngoại lệ
- **Hồ sơ chỉ làm Lần 1:** Các mẫu đơn (Đơn xin Lần 1, Giấy ủy quyền) không yêu cầu in mức thuế. Số tiền hoàn thuế nếu có in sẽ bằng 100% mức bị khấu trừ.
- **Chưa nhận tiền Lần 1:** Có thể dùng số tiền dự kiến để tính nháp.

## 4. Xác nhận
- [ ] Xác nhận bởi Business Owner.
- [ ] Xác nhận bởi Chuyên gia Thuế.

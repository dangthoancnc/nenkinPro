# Phase A.1 Acceptance Report (2026-07-17)

## Bảng đối chiếu Data Contract
Kiểm tra tính nhất quán của dữ liệu từ UI đến lúc xuất PDF.

| STT | Field (Trường) | UI (Nhập/Hiện) | API (Save payload) | Database (Prisma) | Tag (documentMapper) | PDF Render (Vị trí/Nội dung) | Trạng Thái |
|-----|----------------|-----------------|--------------------|-------------------|----------------------|------------------------------|------------|
| 1   | Giới tính (`sex`) | OK | OK | OK | `sex` | OK | Pending |
| 2   | Quốc tịch (`nationality`) | OK | OK | OK | `nationality` | OK | Pending |
| 3   | Điện thoại (`phone`) | OK | OK | OK | `phone` | OK | Pending |
| 4   | Nghề nghiệp (`occupation`) | OK | OK | OK | `occupation` | OK | Pending |
| 5   | Nơi sinh (`placeOfBirth`) | OK | OK | OK | `placeOfBirth` | OK | Pending |
| 6   | Tên chủ hộ (`headOfHouseholdName`) | OK | OK | OK | `headOfHouseholdName` | OK | Pending |
| 7   | Quan hệ với chủ hộ (`relationshipToHead`) | OK | OK | OK | `relationshipToHead` | OK | Pending |
| 8   | Có thường trú (`hasPermanentResidence`) | OK | OK | OK | `hasPermanentResidence` | OK | Pending |
| 9   | Ngày cấp thường trú (`permanentResidenceDate`) | OK | OK | OK | `permanentResidenceDate` | OK | Pending |
| 10  | Ngày rời Nhật (`departureDate`) | OK | OK | OK | `departure_y/m/d` & `departureDate_y/m/d` | OK | Pending |
| 11  | Địa chỉ nước ngoài: Quốc gia (`overseasCountry`) | OK | OK | OK | `overseasCountry` | OK | Pending |
| 12  | Mã bưu điện nước ngoài (`overseasPostalCode`) | OK | OK | OK | `overseasPostalCode` | OK | Pending |
| 13  | Tên chủ TK Katakana (`accountNameKatakana`) | OK | OK | OK | `accountNameKatakana` | OK | Pending |
| 14  | Địa chỉ chi nhánh NH (`bankBranchAddress`) | OK | OK | OK | `bankBranchAddress` | OK | Pending |
| 15  | Quốc gia ngân hàng (`bankCountry`) | OK | OK | OK | `bankCountry` | OK | Pending |
| 16  | Năm thuế (`taxYear`) | OK | OK | OK | `taxYear_era_yr` | OK | Pending |

## Kiểm tra Computed Values
| STT | Tính Toán | Input Hợp Lệ | Thiếu Input | Số 0 / Âm | Trạng Thái |
|-----|-----------|--------------|-------------|-----------|------------|
| 1   | Thuế đã khấu trừ | Đã test | Ra `""` | Ra `""` | Pending |
| 2   | Giảm trừ hưu trí | Đã test | Ra `""` | Ra `""` | Pending |
| 3   | TN chịu thuế | Đã test | Ra `""` | Ra `""` | Pending |
| 4   | Thuế tính lại | Đã test | Ra `""` | Ra `""` | Pending |
| 5   | Hoàn thuế | Đã test | Ra `""` | Ra `""` | Pending |

## Kết quả PDF Rendering (Zoom 100%)
- [ ] Mapper Admin Preview: Tọa độ text khớp.
- [ ] Print Preview (Browser): Chữ hiển thị đúng vị trí.
- [ ] PDF tải xuống: Văn bản không bị cắt, các trường bắt buộc đã được điền đủ (hoặc để trống nếu thiết kế vậy).

## Vấn đề còn lại (Nếu có)
(Chưa có)

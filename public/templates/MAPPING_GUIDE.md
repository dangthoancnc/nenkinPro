# MAPPING GUIDE — NenkinPro Form Generator

> Tài liệu này liệt kê **toàn bộ các biến `{{tag}}`** được tạo ra bởi `src/lib/documentMapper.ts`.  
> Người dùng cần điền đúng các thẻ này vào file `.docx` template bằng Microsoft Word.

---

## Cách sử dụng

Mở file `.docx` template bằng Microsoft Word, gõ `{{tên_biến}}` vào đúng ô cần điền.  
Ví dụ: ô số đầu tiên của mã bưu điện → gõ `{{post_1}}`

---

## 1. Thông tin Khách hàng (Customer)

### 1.1 Tên
| Tag | Dữ liệu nguồn | Ví dụ |
|---|---|---|
| `{{fullName}}` | `customer.fullName` | `NGUYEN VAN A` |
| `{{lastName}}` | `customer.lastName` | `NGUYEN` |
| `{{firstName}}` | `customer.firstName` | `VAN A` |
| `{{fullNameFurigana}}` | `customer.fullNameFurigana` | `グエン バン エー` |
| `{{fullNameFurigana_1}}` ~ `{{fullNameFurigana_N}}` | Từng ký tự Furigana (kể cả khoảng trắng) | `{{fullNameFurigana_1}}` = `グ` |

### 1.2 Mã bưu điện Nhật Bản (〒XXX-XXXX = 7 số)
| Tag | Ví dụ (123-4567) |
|---|---|
| `{{post_1}}` | `1` |
| `{{post_2}}` | `2` |
| `{{post_3}}` | `3` |
| `{{post_4}}` | `4` |
| `{{post_5}}` | `5` |
| `{{post_6}}` | `6` |
| `{{post_7}}` | `7` |
| `{{postalCodeFormat}}` | `123-4567` (nguyên định dạng) |

### 1.3 Địa chỉ
| Tag | Dữ liệu nguồn |
|---|---|
| `{{address}}` | `customer.zairyuAddress` (địa chỉ Nhật Bản) |
| `{{overseasAddress}}` | `customer.overseasAddress` |
| `{{overseasCountry}}` | `customer.overseasCountry` (mặc định: `VIET NAM`) |
| `{{overseasStreet}}` | `customer.overseasStreet` |
| `{{overseasCity}}` | `customer.overseasCity` |
| `{{overseasProvince}}` | `customer.overseasProvince` |
| `{{overseasPostalCode}}` | `customer.overseasPostalCode` |

### 1.4 Ngày sinh (Date of Birth)

> Nguồn: `customer.dob`

| Tag | Ý nghĩa | Ví dụ (1995-03-25) |
|---|---|---|
| `{{dob_full}}` | Dạng đầy đủ YYYY/MM/DD | `1995/03/25` |
| `{{dob_y}}` | Năm dương lịch | `1995` |
| `{{dob_m}}` | Tháng (2 chữ số) | `03` |
| `{{dob_d}}` | Ngày (2 chữ số) | `25` |
| `{{dob_y_1}}` `{{dob_y_2}}` `{{dob_y_3}}` `{{dob_y_4}}` | Từng chữ số năm | `1`,`9`,`9`,`5` |
| `{{dob_m_1}}` `{{dob_m_2}}` | Từng chữ số tháng | `0`,`3` |
| `{{dob_d_1}}` `{{dob_d_2}}` | Từng chữ số ngày | `2`,`5` |
| `{{dob_era}}` | Niên hiệu tiếng Anh | `Heisei` |
| `{{dob_era_jp}}` | Niên hiệu tiếng Nhật | `平成` |
| `{{dob_era_yr}}` | Năm theo niên hiệu (2 chữ số) | `07` |
| `{{dob_era_yr_1}}` `{{dob_era_yr_2}}` | Từng chữ số năm niên hiệu | `0`,`7` |

### 1.5 Ngày xuất cảnh (Departure Date)

> Tương tự cấu trúc DOB, thay tiền tố `dob_` → `departureDate_`

| Tag nhóm | Ví dụ |
|---|---|
| `{{departureDate_full}}` | `2024/12/31` |
| `{{departureDate_era_jp}}` | `令和` |
| `{{departureDate_era_yr}}` | `06` |
| `{{departureDate_era_yr_1}}` `{{departureDate_era_yr_2}}` | `0`,`6` |

### 1.6 Số Nenkin (年金番号 — 10 số)
| Tag | Ví dụ (1234567890) |
|---|---|
| `{{nenkinNumber}}` | `1234567890` |
| `{{nenkin_1}}` ~ `{{nenkin_10}}` | `1`,`2`,`3`,`4`,`5`,`6`,`7`,`8`,`9`,`0` |

### 1.7 MyNumber (マイナンバー — 12 số)
| Tag | Ví dụ (123456789012) |
|---|---|
| `{{my_num_1}}` ~ `{{my_num_12}}` | `1`,`2`,`3`,`4`,`5`,`6`,`7`,`8`,`9`,`0`,`1`,`2` |

### 1.8 Số tài khoản ngân hàng (Bank Account — tối đa 7 số)
| Tag | Ví dụ (1234567) |
|---|---|
| `{{bank_1}}` | `1` |
| `{{bank_2}}` | `2` |
| `{{bank_3}}` | `3` |
| `{{bank_4}}` | `4` |
| `{{bank_5}}` | `5` |
| `{{bank_6}}` | `6` |
| `{{bank_7}}` | `7` |

### 1.9 Thông tin ngân hàng (đầy đủ)
| Tag | Dữ liệu nguồn |
|---|---|
| `{{bankName}}` | `customer.bankName` |
| `{{branchName}}` | `customer.branchName` |
| `{{bankBranchAddress}}` | `customer.bankBranchAddress` |
| `{{bankBranchCity}}` | `customer.bankBranchCity` |
| `{{bankCountry}}` | `customer.bankCountry` (mặc định: `VIET NAM`) |
| `{{accountName}}` | `customer.accountName` |
| `{{accountNameKatakana}}` | `customer.accountNameKatakana` |
| `{{swiftCode}}` | `customer.swiftCode` |
| `{{swift_1}}` ~ `{{swift_11}}` | Từng ký tự SWIFT code |

### 1.10 Điện thoại (Phone — tối đa 11 số)
| Tag | Ví dụ (09012345678) |
|---|---|
| `{{phone}}` | `09012345678` |
| `{{phone_1}}` ~ `{{phone_11}}` | Từng chữ số |

### 1.11 Thông tin cá nhân khác
| Tag | Dữ liệu nguồn | Ghi chú |
|---|---|---|
| `{{nationality}}` | `customer.nationality` | Mặc định: `VIET NAM` |
| `{{sex}}` | `customer.sex` | `Nam` hoặc `Nữ` |
| `{{sex_M_mark}}` | — | `○` nếu Nam, `''` nếu Nữ |
| `{{sex_F_mark}}` | — | `○` nếu Nữ, `''` nếu Nam |
| `{{occupation}}` | `customer.occupation` | — |
| `{{headOfHouseholdName}}` | `customer.headOfHouseholdName` | — |
| `{{relationshipToHead}}` | `customer.relationshipToHead` | Mặc định: `納税管理人` |
| `{{hasPermanentResidence}}` | `customer.hasPermanentResidence` | `YES` hoặc `NO` |
| `{{permRes_YES_mark}}` | — | `○` nếu có, `''` nếu không |
| `{{permRes_NO_mark}}` | — | `○` nếu không, `''` nếu có |

### 1.12 Ngày thường trú (nếu có)
> Tiền tố `permResDate_` — cấu trúc giống DOB

### 1.13 Cục thuế (Tax Office)
| Tag | Dữ liệu nguồn |
|---|---|
| `{{taxOfficeName}}` | `customer.taxOffice.name` |
| `{{taxOfficeAddress}}` | `customer.taxOffice.address` |
| `{{taxOfficeZipCode}}` | `customer.taxOffice.postalCode` |
| `{{tax_post_1}}` ~ `{{tax_post_7}}` | Từng chữ số mã bưu điện cục thuế |

---

## 2. Lịch sử Làm việc (WorkHistory)

> Mỗi công ty được đánh số từ 1. Thay `N` bằng số thứ tự (1, 2, 3...).

| Tag | Dữ liệu nguồn |
|---|---|
| `{{workHistory_N_companyName}}` | `workHistory[N].companyName` |
| `{{workHistory_N_companyAddress}}` | `workHistory[N].companyAddress` |
| `{{workHistory_N_start_full}}` | Ngày bắt đầu (YYYY/MM/DD) |
| `{{workHistory_N_start_era_jp}}` | Niên hiệu ngày bắt đầu |
| `{{workHistory_N_end_full}}` | Ngày kết thúc |
| `{{workHistory_N_end_era_jp}}` | Niên hiệu ngày kết thúc |
| `{{workHistory_N_pensionType}}` | `厚生年金保険` (mặc định) |
| `{{workHistory_N_type_1_mark}}` | `○` nếu 国民年金 |
| `{{workHistory_N_type_2_mark}}` | `○` nếu 厚生年金保険 |
| `{{workHistory_N_type_3_mark}}` | `○` nếu 船員保険 |
| `{{workHistory_N_type_4_mark}}` | `○` nếu 共済組合 |

---

## 3. Người đại diện thuế (TaxRepresentative / 納税管理人)

| Tag | Dữ liệu nguồn |
|---|---|
| `{{rep_fullName}}` | `taxRepresentative.fullName` |
| `{{rep_fullNameKana}}` | `taxRepresentative.fullNameKana` |
| `{{rep_address}}` | `taxRepresentative.address` |
| `{{rep_postalCodeFormat}}` | `taxRepresentative.postalCode` (dạng `123-4567`) |
| `{{rep_post_1}}` ~ `{{rep_post_7}}` | Từng chữ số mã bưu điện |
| `{{rep_phone}}` | `taxRepresentative.phone` |
| `{{rep_phone_1}}` ~ `{{rep_phone_11}}` | Từng chữ số điện thoại |
| `{{rep_relationship}}` | `taxRepresentative.relationship` (mặc định: `納税管理人`) |
| `{{rep_bankName}}` | `taxRepresentative.bankName` |
| `{{rep_branchName}}` | `taxRepresentative.branchName` |
| `{{rep_accountNumber}}` | `taxRepresentative.accountNumber` |
| `{{rep_accountName}}` | `taxRepresentative.accountName` |

---

## 4. Hồ sơ Nenkin (NenkinApplication)

### 4.1 Ngày tháng
| Tag | Dữ liệu nguồn |
|---|---|
| `{{applyDate_full}}` | `application.applyDate` |
| `{{applyDate_era_jp}}` | Niên hiệu ngày nộp đơn |
| `{{applyDate_era_yr}}` | Năm niên hiệu ngày nộp |
| `{{noticeDate_full}}` | `application.noticeDate` |
| `{{noticeDate_era_jp}}` | Niên hiệu ngày thông báo kết quả |

### 4.2 Năm khai thuế
| Tag | Dữ liệu nguồn | Ví dụ |
|---|---|---|
| `{{taxYear_era_yr}}` | `application.taxYear` (Reiwa) | `05` |
| `{{taxYear_era_yr_1}}` `{{taxYear_era_yr_2}}` | Từng chữ số | `0`,`5` |

### 4.3 Tài chính
| Tag | Dữ liệu nguồn | Ý nghĩa |
|---|---|---|
| `{{totalExpectedJpy}}` | `application.totalExpectedJpy` | 支給額 — Tổng tiền dự kiến |
| `{{received1stJpy}}` | `application.received1stJpy` | 控除後支払額 — Thực nhận Lần 1 |
| `{{received2ndJpy}}` | `application.received2ndJpy` | Thực nhận Lần 2 |
| `{{tax2ndJpy}}` | `application.tax2ndJpy` | 所得税額 — Thuế Lần 2 |
| `{{withheldTax}}` | `application.withheldTax` | 源泉徴収税額 — Thuế khấu trừ 20.42% |
| `{{serviceFeeJpy}}` | `application.serviceFeeJpy` | Phí dịch vụ JPY |
| `{{exchangeRate}}` | `application.exchangeRate` | Tỷ giá JPY/VND |
| `{{serviceFeeVnd}}` | `application.serviceFeeVnd` | Phí dịch vụ VND |

### 4.4 Tính toán khai thuế (Bảng 3 — 申告書)
| Tag | Công thức / Nguồn |
|---|---|
| `{{retirementDeductionAmount}}` | `ceil(workYears) × 400,000 JPY` |
| `{{taxableRetirementIncome}}` | `0` (thường nhỏ hơn mức khấu trừ) |
| `{{calculatedTax}}` | `0` |
| `{{refundAmount}}` | Bằng `{{withheldTax}}` — toàn bộ thuế khấu trừ được hoàn |

---

## 5. Danh sách Template Files

| File | Template Type | Dùng cho |
|---|---|---|
| `脱退一時金請求書.docx` | `LAN1_DATTAI` | Đơn xin rút lương hưu Lần 1 |
| `委 任 状.docx` | `LAN2_UININJOU` | Ủy nhiệm thư Lần 2 |
| `納税管理人届出書.docx` | `LAN2_TAX_AGENT` | Đăng ký người đại diện thuế |

---

## 6. Ví dụ đầy đủ — Map tài khoản ngân hàng 7 số

Dữ liệu: `customer.accountNumber = "1234567"`

```
{{bank_1}} → 1
{{bank_2}} → 2
{{bank_3}} → 3
{{bank_4}} → 4
{{bank_5}} → 5
{{bank_6}} → 6
{{bank_7}} → 7
```

Trong file `.docx`, mỗi ô số tài khoản ngân hàng chứa 1 tag:
```
[ {{bank_1}} ][ {{bank_2}} ][ {{bank_3}} ][ {{bank_4}} ][ {{bank_5}} ][ {{bank_6}} ][ {{bank_7}} ]
```

---

## 7. Ví dụ đầy đủ — Map ngày sinh sang Niên hiệu Nhật

Dữ liệu: `customer.dob = 1995-03-25`

```
{{dob_era_jp}}     → 平成
{{dob_era_yr}}     → 07
{{dob_era_yr_1}}   → 0
{{dob_era_yr_2}}   → 7
{{dob_m_1}}        → 0
{{dob_m_2}}        → 3
{{dob_d_1}}        → 2
{{dob_d_2}}        → 5
```

Trong file `.docx` (biểu mẫu cục thuế):
```
Năm [平成/令和]: [{{dob_era_jp}}] [{{dob_era_yr_1}}][{{dob_era_yr_2}}] năm [{{dob_m_1}}][{{dob_m_2}}] tháng [{{dob_d_1}}][{{dob_d_2}}] ngày
```

---

*Được tạo tự động từ `src/lib/documentMapper.ts` — cập nhật 2026-07-15*  
*Thực hiện bởi PE (Perplexity) + AN (AntiGravity)*

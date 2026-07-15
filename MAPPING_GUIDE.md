# MAPPING_GUIDE — Data Contract cho documentMapper.ts

> **Bản hợp đồng dữ liệu (Data Contract)** giữa Word Template và `documentMapper.ts`.
> Mọi `{{tag}}` trong file .docx phải được khai báo ở đây trước khi code.
> Cập nhật bởi PE (Perplexity) — 2026-07-15

---

## Quy tắc chung

| Quy tắc | Chi tiết |
|---|---|
| Cú pháp trong .docx | `{{tag_name}}` (không có dấu cách bên trong) |
| Kiểu trả về | Tất cả giá trị **phải là `string`** — số và ngày đều stringify trước khi render |
| Giá trị rỗng | Trả về `""` (chuỗi rỗng), không được `null` hay `undefined` |
| Ký tự số chia ô | Mỗi ô số riêng biệt trong biểu mẫu dùng `{{field_N}}` (N bắt đầu từ 1) |
| Ngày dương lịch | `dob_y` / `dob_m` / `dob_d` — zero-padded 2 chữ số, năm 4 chữ số |
| Ngày âm lịch Nhật | `dob_era` + `dob_era_yr` — cần bảng chuyển đổi Era |

---

## TEMPLATE 1 — 脱退一時金請求書 (Đơn xin hoàn tiền Nenkin)

### T1-A: Thông tin Khách hàng (Customer)

| Tag | Nguồn dữ liệu (Prisma field) | Kiểu | Format / Ví dụ |
|---|---|---|---|
| `{{fullName}}` | `customer.fullName` | string | `NGUYEN VAN A` |
| `{{fullName_kata}}` | `customer.fullNameKata` | string | `グエン ヴァン エー` |
| `{{fullName_1}}` ~ `{{fullName_N}}` | `customer.fullName` chia từng ký tự | string | `N`, `G`, `U`... |
| `{{dob_y}}` | `customer.dateOfBirth` | string | `1990` |
| `{{dob_m}}` | `customer.dateOfBirth` | string | `03` |
| `{{dob_d}}` | `customer.dateOfBirth` | string | `15` |
| `{{dob_y_1}}`~`{{dob_y_4}}` | `customer.dateOfBirth` năm chia ô | string | `1`,`9`,`9`,`0` |
| `{{dob_m_1}}`~`{{dob_m_2}}` | tháng chia ô | string | `0`,`3` |
| `{{dob_d_1}}`~`{{dob_d_2}}` | ngày chia ô | string | `1`,`5` |
| `{{dob_era}}` | Chuyển đổi từ `dateOfBirth` | string | `Heisei` / `Reiwa` / `Showa` |
| `{{dob_era_jp}}` | Chuyển đổi từ `dateOfBirth` | string | `平成` / `令和` / `昭和` |
| `{{dob_era_yr}}` | Số năm trong era | string | `02` (zero-padded) |
| `{{dob_era_yr_1}}`~`{{dob_era_yr_2}}` | era year chia ô | string | `0`,`2` |
| `{{nationality}}` | `customer.nationality` | string | `ベトナム` |
| `{{address_jp}}` | `customer.addressJp` | string | `東京都新宿区...` |
| `{{address_1}}` ~ `{{address_N}}` | `customer.addressJp` chia từng ký tự | string | (mỗi ô 1 ký tự) |
| `{{post_1}}`~`{{post_7}}` | `customer.postalCode` chia ô | string | `1`,`6`,`0`,`0`,`0`,`2`,`2` |
| `{{phone}}` | `customer.phone` | string | `090-1234-5678` |
| `{{nenkin_1}}`~`{{nenkin_10}}` | `customer.nenkinNumber` chia ô | string | mỗi ô 1 chữ số |
| `{{my_num_1}}`~`{{my_num_12}}` | `customer.myNumber` chia ô | string | mỗi ô 1 chữ số |
| `{{gender}}` | `customer.gender` | string | `男` / `女` |
| `{{gender_male_check}}` | `customer.gender === 'MALE'` | string | `✓` hoặc `""` |
| `{{gender_female_check}}` | `customer.gender === 'FEMALE'` | string | `✓` hoặc `""` |

### T1-B: Tài khoản ngân hàng (Customer bank)

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{bank_name}}` | `customer.bankName` | string | `みずほ銀行` |
| `{{bank_branch}}` | `customer.bankBranch` | string | `新宿支店` |
| `{{bank_account_type}}` | `customer.bankAccountType` | string | `普通` / `当座` |
| `{{bank_1}}`~`{{bank_7}}` | `customer.bankAccountNumber` chia ô | string | mỗi ô 1 chữ số |
| `{{bank_account_name}}` | `customer.bankAccountName` | string | `グエン ヴァン エー` |

### T1-C: Lịch sử công việc (WorkHistory)

> Mỗi dòng WorkHistory là một entry. Lấy entry mới nhất hoặc toàn bộ tùy template.

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{work_company_1}}` | `workHistories[0].companyName` | string | `株式会社ABC` |
| `{{work_start_1}}` | `workHistories[0].startDate` | string | `2018/04/01` |
| `{{work_end_1}}` | `workHistories[0].endDate` | string | `2023/03/31` |
| `{{work_company_2}}` | `workHistories[1].companyName` | string | (nếu có entry thứ 2) |
| `{{work_start_2}}` | ... | string | ... |
| `{{work_end_2}}` | ... | string | ... |
| `{{work_last_company}}` | Entry công ty gần nhất | string | `株式会社XYZ` |
| `{{work_last_end_y}}` | Năm kết thúc công việc cuối | string | `2023` |
| `{{work_last_end_m}}` | Tháng | string | `03` |

### T1-D: Thông tin Hồ sơ (Application)

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{app_id}}` | `application.id` (rút gọn 8 ký tự) | string | `ab12cd34` |
| `{{today_y}}` | Ngày xuất biểu mẫu — năm | string | `2026` |
| `{{today_m}}` | tháng | string | `07` |
| `{{today_d}}` | ngày | string | `15` |
| `{{today_era_jp}}` | Era Nhật hôm nay | string | `令和` |
| `{{today_era_yr}}` | Năm trong era | string | `08` |
| `{{today_era_m}}` | Tháng hôm nay | string | `07` |
| `{{today_era_d}}` | Ngày hôm nay | string | `15` |

---

## TEMPLATE 2 — 委任状 (Giấy ủy quyền)

### T2-A: Thông tin ủy quyền

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{fullName}}` | `customer.fullName` | string | `NGUYEN VAN A` |
| `{{fullName_kata}}` | `customer.fullNameKata` | string | `グエン ヴァン エー` |
| `{{dob_y}}` | `customer.dateOfBirth` năm | string | `1990` |
| `{{dob_m}}` | tháng | string | `03` |
| `{{dob_d}}` | ngày | string | `15` |
| `{{address_jp}}` | `customer.addressJp` | string | `東京都...` |
| `{{post_1}}`~`{{post_7}}` | `customer.postalCode` chia ô | string | |
| `{{nenkin_1}}`~`{{nenkin_10}}` | `customer.nenkinNumber` chia ô | string | |

### T2-B: Thông tin người được ủy quyền (Tax Representative)

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{rep_fullName}}` | `taxRepresentative.fullName` | string | `田中 太郎` |
| `{{rep_fullName_kata}}` | `taxRepresentative.fullNameKata` | string | `タナカ タロウ` |
| `{{rep_address}}` | `taxRepresentative.address` | string | `東京都渋谷区...` |
| `{{rep_post_1}}`~`{{rep_post_7}}` | `taxRepresentative.postalCode` chia ô | string | |
| `{{rep_phone}}` | `taxRepresentative.phone` | string | `03-1234-5678` |
| `{{rep_relation}}` | `taxRepresentative.relation` | string | `代理人` |

### T2-C: Ngày lập giấy ủy quyền

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{doc_date_era_jp}}` | Ngày tạo application / hôm nay | string | `令和` |
| `{{doc_date_era_yr}}` | Năm era | string | `07` |
| `{{doc_date_m}}` | Tháng | string | `07` |
| `{{doc_date_d}}` | Ngày | string | `15` |

### T2-D: Cục thuế liên quan

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{taxOfficeName}}` | `taxOffice.name` | string | `新宿税務署` |
| `{{taxOfficeAddress}}` | `taxOffice.address` | string | `東京都新宿区...` |

---

## TEMPLATE 3 — 納税管理人届出書 (Giấy báo người đại diện nộp thuế)

### T3-A: Người nộp hồ sơ (Taxpayer — Customer)

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{fullName}}` | `customer.fullName` | string | `NGUYEN VAN A` |
| `{{fullName_kata}}` | `customer.fullNameKata` | string | `グエン ヴァン エー` |
| `{{dob_y}}`, `{{dob_m}}`, `{{dob_d}}` | `customer.dateOfBirth` | string | `1990`, `03`, `15` |
| `{{dob_era_jp}}`, `{{dob_era_yr}}` | Era từ dateOfBirth | string | `平成`, `02` |
| `{{address_jp}}` | `customer.addressJp` | string | |
| `{{post_1}}`~`{{post_7}}` | `customer.postalCode` chia ô | string | |
| `{{phone}}` | `customer.phone` | string | |
| `{{nationality}}` | `customer.nationality` | string | `ベトナム` |
| `{{departure_y}}` | Năm rời Nhật | string | `2023` |
| `{{departure_m}}` | Tháng rời Nhật | string | `06` |
| `{{departure_d}}` | Ngày rời Nhật | string | `30` |
| `{{departure_y_1}}`~`{{departure_y_4}}` | năm rời Nhật chia ô | string | `2`,`0`,`2`,`3` |
| `{{departure_m_1}}`~`{{departure_m_2}}` | tháng rời Nhật chia ô | string | `0`,`6` |
| `{{departure_d_1}}`~`{{departure_d_2}}` | ngày rời Nhật chia ô | string | `3`,`0` |

### T3-B: Người đại diện nộp thuế (Tax Representative)

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{rep_fullName}}` | `taxRepresentative.fullName` | string | `田中 太郎` |
| `{{rep_fullName_kata}}` | `taxRepresentative.fullNameKata` | string | `タナカ タロウ` |
| `{{rep_address}}` | `taxRepresentative.address` | string | |
| `{{rep_post_1}}`~`{{rep_post_7}}` | `taxRepresentative.postalCode` chia ô | string | |
| `{{rep_phone}}` | `taxRepresentative.phone` | string | |
| `{{rep_dob_y}}`, `{{rep_dob_m}}`, `{{rep_dob_d}}` | `taxRepresentative.dateOfBirth` | string | |
| `{{rep_relation}}` | `taxRepresentative.relation` | string | `税理士` / `代理人` |

### T3-C: Ngày lập tờ khai

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{doc_date_era_jp}}` | Hôm nay / ngày tạo | string | `令和` |
| `{{doc_date_era_yr}}` | | string | `08` |
| `{{doc_date_m}}` | | string | `07` |
| `{{doc_date_d}}` | | string | `15` |

### T3-D: Cục thuế

| Tag | Nguồn dữ liệu | Kiểu | Ví dụ |
|---|---|---|---|
| `{{taxOfficeName}}` | `taxOffice.name` | string | `新宿税務署` |
| `{{taxOfficeAddress}}` | `taxOffice.address` | string | |

---

## Bảng chuyển đổi Japanese Era

```typescript
// Helper: dùng trong documentMapper.ts
function toJapaneseEra(date: Date): { era: string; eraJp: string; eraYear: number } {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ymd = y * 10000 + m * 100 + d;

  if (ymd >= 20190501) return { era: 'Reiwa',   eraJp: '令和', eraYear: y - 2018 };
  if (ymd >= 19890108) return { era: 'Heisei',  eraJp: '平成', eraYear: y - 1988 };
  if (ymd >= 19261225) return { era: 'Showa',   eraJp: '昭和', eraYear: y - 1925 };
  return                        { era: 'Taisho',  eraJp: '大正', eraYear: y - 1911 };
}
```

---

## Helper: splitChars (dùng cho tất cả chia-ô)

```typescript
// Chia chuỗi thành Record các tags: field_1, field_2...
function splitChars(
  value: string,
  tagPrefix: string,
  length: number
): Record<string, string> {
  const cleaned = value.replace(/[^\d\w]/g, ''); // bỏ dấu gạch, dấu chấm
  const result: Record<string, string> = {};
  for (let i = 0; i < length; i++) {
    result[`${tagPrefix}_${i + 1}`] = cleaned[i] ?? '';
  }
  return result;
}

// Ví dụ:
// splitChars('160-0022', 'post', 7)
// → { post_1:'1', post_2:'6', post_3:'0', post_4:'0', post_5:'0', post_6:'2', post_7:'2' }
```

---

## Tổng hợp số lượng tags

| Template | Số tags | Ghi chú |
|---|---|---|
| T1 — 脱退一時金請求書 | ~85 tags | Phức tạp nhất, đủ thông tin khách hàng + tài khoản + work history |
| T2 — 委任状 | ~35 tags | Tập trung vào representative + customer + tax office |
| T3 — 納税管理人届出書 | ~45 tags | Giống T2 nhưng thêm departure date |

---

*Cập nhật lần cuối: 2026-07-15 bởi PE (Perplexity)*

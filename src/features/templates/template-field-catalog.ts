import { DocumentTemplate } from './template-schema';

export type FieldFormat = 'split-char' | 'full-date' | 'string' | 'number' | 'boolean' | 'mark';

export interface TemplateField {
  id: string;
  label: string;
  format?: FieldFormat;
  semantic?: string;
  appliesTo: string[]; // '*' for all, or specific template IDs
  required?: boolean | ((context: any) => boolean);
}

export interface FieldGroup {
  name: string;
  tags: TemplateField[];
}

const ALL_TEMPLATES = ['*'];

const generateSplitTags = (prefix: string, count: number, labelPrefix: string, appliesTo: string[] = ALL_TEMPLATES, required: boolean | ((context: any) => boolean) = false): TemplateField[] => 
  Array.from({ length: count }, (_, i) => ({ 
    id: `${prefix}_${i + 1}`, 
    label: `${labelPrefix} (Ký tự ${i + 1})`,
    format: 'split-char',
    appliesTo,
    required
  }));

export const TEMPLATE_FIELD_CATALOG: FieldGroup[] = [
  {
    name: '1. Thông tin cá nhân',
    tags: [
      { id: 'fullName', label: 'Khách hàng (Người ủy quyền): Họ và tên Romaji (Nguyên khối)', appliesTo: ALL_TEMPLATES, required: true },
      { id: 'fullName_kata', label: 'Khách hàng (Người ủy quyền): Furigana (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'lastName', label: 'Khách hàng: Họ Romaji', appliesTo: ['don_xin_lan_1'] },
      { id: 'firstName', label: 'Khách hàng: Tên Romaji', appliesTo: ['don_xin_lan_1'] },
      { id: 'sex', label: 'Khách hàng: Giới tính (Text 男/女)', appliesTo: ALL_TEMPLATES },
      { id: 'gender_male_check_mark', label: 'Khách hàng: Nam (✓)', format: 'mark', appliesTo: ['don_xin_lan_1'] },
      { id: 'gender_female_check_mark', label: 'Khách hàng: Nữ (✓)', format: 'mark', appliesTo: ['don_xin_lan_1'] },
      { id: 'sex_M_mark', label: 'Khách hàng: Nam (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'sex_F_mark', label: 'Khách hàng: Nữ (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'nationality', label: 'Khách hàng: Quốc tịch', appliesTo: ALL_TEMPLATES },
      { id: 'passportNumber', label: 'Khách hàng: Số hộ chiếu', appliesTo: ['don_xin_lan_1'] },
      { id: 'myNumber', label: 'Khách hàng: My Number (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('my_num', 12, 'Khách hàng: My Number'),
      { id: 'nenkinNumber', label: 'Khách hàng: Số Nenkin (Nguyên khối)', appliesTo: ALL_TEMPLATES, required: true },
      ...generateSplitTags('nenkin', 10, 'Khách hàng: Số Nenkin', ALL_TEMPLATES, () => true),
      ...generateSplitTags('pensionSystemRegistrationNumber', 10, 'Khách hàng: Ký hiệu mã số khác (記号番号)', ['don_xin_lan_1']),
      { id: 'cardNumber', label: 'Khách hàng: Số thẻ ngoại kiều', appliesTo: ['don_xin_lan_1'] },
      { id: 'phone', label: 'Khách hàng: SĐT (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'phone_group_1', label: 'Khách hàng: SĐT Nhóm 1 (VD: 090)', appliesTo: ALL_TEMPLATES },
      { id: 'phone_group_2', label: 'Khách hàng: SĐT Nhóm 2 (VD: 1234)', appliesTo: ALL_TEMPLATES },
      { id: 'phone_group_3', label: 'Khách hàng: SĐT Nhóm 3 (VD: 5678)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('phone', 11, 'Khách hàng: SĐT'),
      ...generateSplitTags('fullName_kata', 14, 'Khách hàng: Furigana (Katakana)'),
      { id: 'permRes_YES_mark', label: 'Khách hàng: Vĩnh trú CÓ (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'permRes_NO_mark', label: 'Khách hàng: Vĩnh trú KHÔNG (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'occupation', label: 'Khách hàng: Nghề nghiệp', appliesTo: ALL_TEMPLATES },
      { id: 'placeOfBirth', label: 'Khách hàng: Nơi sinh', appliesTo: ALL_TEMPLATES },
      { id: 'headOfHouseholdName', label: 'Khách hàng: Tên Chủ hộ', appliesTo: ALL_TEMPLATES },
      { id: 'relationshipToHead', label: 'Khách hàng: Quan hệ với chủ hộ', appliesTo: ALL_TEMPLATES },
    ]
  },
  {
    name: '2. Địa chỉ & Nơi cư trú',
    tags: [
      { id: 'address', label: 'Địa chỉ tại Nhật (Nguyên khối)', appliesTo: ALL_TEMPLATES, required: true },
      { id: 'postalCodeFormat', label: 'Mã Bưu điện Nhật (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('post', 7, 'Mã BĐ Nhật'),
      { id: 'overseasCountry', label: 'Quốc gia hải ngoại', appliesTo: ['don_xin_lan_1', 'giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'overseasStreet', label: 'Số nhà, đường hải ngoại', appliesTo: ['don_xin_lan_1', 'giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'overseasCity', label: 'Thành phố hải ngoại', appliesTo: ['don_xin_lan_1', 'giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'overseasProvince', label: 'Tỉnh/Bang hải ngoại', appliesTo: ['don_xin_lan_1', 'giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'overseasPostalCode', label: 'Mã bưu điện hải ngoại', appliesTo: ['don_xin_lan_1', 'giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'overseasAddress', label: 'Địa chỉ hải ngoại (Nguyên khối VN)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'permResDate_full', label: 'Ngày cấp vĩnh trú (Nguyên khối YYYY/MM/DD)', appliesTo: ALL_TEMPLATES },
      { id: 'permResDate_y', label: 'Năm cấp vĩnh trú (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'permResDate_m', label: 'Tháng cấp vĩnh trú (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'permResDate_d', label: 'Ngày cấp vĩnh trú (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('permResDate_y', 4, 'Năm cấp vĩnh trú', ALL_TEMPLATES, (ctx) => !!ctx.permRes_YES_mark),
      ...generateSplitTags('permResDate_m', 2, 'Tháng cấp vĩnh trú', ALL_TEMPLATES, (ctx) => !!ctx.permRes_YES_mark),
      ...generateSplitTags('permResDate_d', 2, 'Ngày cấp vĩnh trú', ALL_TEMPLATES, (ctx) => !!ctx.permRes_YES_mark),
    ]
  },
  {
    name: '2b. Đại lý nhận ủy quyền (Form 2) & Đại diện thuế (Form 3 / Giấy ủy thác L2)',
    tags: [
      { id: 'agentName', label: 'Đại lý nhận ủy quyền (Công ty): Tên', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'agentAddress', label: 'Đại lý nhận ủy quyền (Công ty): Địa chỉ', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'agentPhone', label: 'Đại lý nhận ủy quyền (Công ty): SĐT', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'delegationPurpose', label: 'Đại lý nhận ủy quyền (Công ty): Nội dung ủy thác', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'taxRep_appoint_mark', label: 'Đại diện thuế: Chọn 選任 (○)', format: 'mark', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'], required: true },
      { id: 'taxRep_dismiss_mark', label: 'Đại diện thuế: Hủy 解任 (○)', format: 'mark', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'taxRep_appoint_reason', label: 'Đại diện thuế: Lý do chỉ định (出国のため)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'income_salary_mark', label: 'Thu nhập tại Nhật: 给与所得 (○)', format: 'mark', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'income_business_mark', label: 'Thu nhập tại Nhật: 事業所得 (○)', format: 'mark', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'income_realestate_mark', label: 'Thu nhập tại Nhật: 不動産所得 (○)', format: 'mark', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'income_transfer_mark', label: 'Thu nhập tại Nhật: 譲渡所得 (○)', format: 'mark', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'income_other_detail', label: 'Thu nhập tại Nhật: Thu nhập khác (退職所得（脱退一時金）)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'other_reference_note', label: 'Mục 5-(3): Ghi chú tham khảo khác (その他)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
    ]
  },
  {
    name: '3. Ngày tháng',
    tags: [
      // --- 1. Ngày sinh khách hàng (Date of Birth) ---
      { id: 'dob_era_jp', label: 'Ngày sinh: Chữ Kỷ nguyên Nhật (平成/昭和)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_era_code', label: 'Ngày sinh: Mã niên hiệu (Showa=3, Heisei=4, Reiwa=5)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_y', label: 'Ngày sinh: Năm Tây (Nguyên khối YYYY - VD: 1995)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('dob_y', 4, 'Ngày sinh: Năm Tây'),
      { id: 'dob_era_yr', label: 'Ngày sinh: Năm Nhật (Nguyên khối 2 chữ số - VD: 07)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('dob_era_yr', 2, 'Ngày sinh: Năm Nhật'),
      { id: 'dob_m', label: 'Ngày sinh: Tháng (Nguyên khối 2 chữ số - VD: 08)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('dob_m', 2, 'Ngày sinh: Tháng'),
      { id: 'dob_d', label: 'Ngày sinh: Ngày (Nguyên khối 2 chữ số - VD: 15)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('dob_d', 2, 'Ngày sinh: Ngày'),

      // --- 2. Ngày tạo/lập hồ sơ (Document Date) ---
      { id: 'doc_date_era_jp', label: 'Chữ Reiwa (令和)', appliesTo: ALL_TEMPLATES },
      { id: 'doc_date_era_yr', label: 'Năm lập hồ sơ (Nguyên khối 2 chữ số - VD: 08)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('doc_date_era_yr', 2, 'Năm lập hồ sơ'),
      { id: 'doc_date_m', label: 'Tháng lập hồ sơ (Nguyên khối 2 chữ số - VD: 02)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('doc_date_m', 2, 'Tháng lập hồ sơ'),
      { id: 'doc_date_d', label: 'Ngày lập hồ sơ (Nguyên khối 2 chữ số - VD: 15)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('doc_date_d', 2, 'Ngày lập hồ sơ'),

      // --- 3. Năm khai thuế (Tax Year) ---
      { id: 'taxYear_era_yr', label: 'Năm khai thuế Nhật (Nguyên khối 2 chữ số - VD: 08)', appliesTo: ALL_TEMPLATES },
      { id: 'taxYear_era_yr_unit', label: 'Năm khai thuế Nhật (Chỉ hàng đơn vị - VD: 8 cho mẫu 令和 0 ⎕)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('taxYear_era_yr', 2, 'Năm khai thuế Nhật'),

      // --- 4. Ngày xuất cảnh / Ngày xin Nenkin / Thông báo ---
      { id: 'departureDate_y', label: 'Năm xuất cảnh (Nguyên khối YYYY)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'don_xin_lan_1'] },
      { id: 'departureDate_m', label: 'Tháng xuất cảnh (Nguyên khối MM)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'don_xin_lan_1'] },
      { id: 'departureDate_d', label: 'Ngày xuất cảnh (Nguyên khối DD)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'don_xin_lan_1'] },
      ...generateSplitTags('departureDate_y', 4, 'Năm xuất cảnh', ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'don_xin_lan_1']),
      ...generateSplitTags('departureDate_m', 2, 'Tháng xuất cảnh', ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'don_xin_lan_1']),
      ...generateSplitTags('departureDate_d', 2, 'Ngày xuất cảnh', ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'don_xin_lan_1']),
      ...generateSplitTags('departure_y', 4, 'Năm xuất cảnh (Ô departure_y)', ['giay_uy_thac_lan_2', 'nouzeikanrinin']),
      ...generateSplitTags('departure_m', 2, 'Tháng xuất cảnh (Ô departure_m)', ['giay_uy_thac_lan_2', 'nouzeikanrinin']),
      ...generateSplitTags('departure_d', 2, 'Ngày xuất cảnh (Ô departure_d)', ['giay_uy_thac_lan_2', 'nouzeikanrinin']),

      { id: 'applyDate_y', label: 'Năm xin Nenkin (Nguyên khối YYYY)', appliesTo: ['don_xin_lan_1'] },
      { id: 'applyDate_m', label: 'Tháng xin Nenkin (Nguyên khối MM)', appliesTo: ['don_xin_lan_1'] },
      { id: 'applyDate_d', label: 'Ngày xin Nenkin (Nguyên khối DD)', appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags('applyDate_y', 4, 'Năm xin Nenkin', ['don_xin_lan_1']),
      ...generateSplitTags('applyDate_m', 2, 'Tháng xin Nenkin', ['don_xin_lan_1']),
      ...generateSplitTags('applyDate_d', 2, 'Ngày xin Nenkin', ['don_xin_lan_1']),

      { id: 'noticeDate_y', label: 'Giấy 20%: Năm nhận thông báo (VD: 2026)', appliesTo: ['bang_3', 'bang_1_2'] },
      { id: 'noticeDate_m', label: 'Giấy 20%: Tháng nhận thông báo (VD: 03)', appliesTo: ['bang_3', 'bang_1_2'] },
      { id: 'noticeDate_d', label: 'Giấy 20%: Ngày nhận thông báo (VD: 01)', appliesTo: ['bang_3', 'bang_1_2'] },
      ...generateSplitTags('noticeDate_y', 4, 'Giấy 20%: Năm nhận thông báo', ['bang_3', 'bang_1_2']),
      ...generateSplitTags('noticeDate_m', 2, 'Giấy 20%: Tháng nhận thông báo', ['bang_3', 'bang_1_2']),
      ...generateSplitTags('noticeDate_d', 2, 'Giấy 20%: Ngày nhận thông báo', ['bang_3', 'bang_1_2']),

      { id: 'applicantSignature', label: 'Chữ ký người làm đơn', appliesTo: ['don_xin_lan_1'], required: true },
      { id: 'principalSignature', label: 'Chữ ký người ủy quyền', appliesTo: ['ininjyo_yoshiki_lan_1'], required: true },
      { id: 'applicationAcknowledgement_mark', label: 'Xác nhận nội dung đơn (○)', format: 'mark', appliesTo: ['don_xin_lan_1'], required: true },
    ]
  },
  {
    name: '4. Tài khoản Ngân hàng',
    tags: [
      { id: 'bankName', label: 'Tên Ngân hàng (Mizuho / Yucho / Vietcombank)', appliesTo: ALL_TEMPLATES },
      { id: 'branchName', label: 'Tên chi nhánh', appliesTo: ALL_TEMPLATES },
      { id: 'bankBranchAddress', label: 'Địa chỉ chi nhánh', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'bankBranchCity', label: 'TP chi nhánh', appliesTo: ['don_xin_lan_1'] },
      { id: 'bankCountry', label: 'Quốc gia NH', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'accountNumber', label: 'Số tài khoản / Yucho (Nguyên khối dạt phải)', appliesTo: ALL_TEMPLATES },
      { id: 'accountName', label: 'Tên tài khoản (Romaji)', appliesTo: ['don_xin_lan_1'] },
      { id: 'accountNameKatakana', label: 'Tên tài khoản (Katakana)', appliesTo: ALL_TEMPLATES, required: (ctx) => ctx.bankCountry === 'JP' || ctx.bankCountry === 'Nhật Bản' },
      { id: 'swiftCode', label: 'SWIFT Code (Nguyên khối)', appliesTo: ['don_xin_lan_1'] },
      { id: 'bank_type_bank_mark', label: 'Loại Ngân hàng: 銀行 (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'bank_type_shiten_mark', label: 'Loại Ngân hàng: 支店 (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'bank_type_honten_mark', label: 'Loại Ngân hàng: 本店 (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'bank_type_syuchojo_mark', label: 'Loại Ngân hàng: 出張所 (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'account_type_futsu_mark', label: 'Loại TK: Thường 普通 (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'account_type_toza_mark', label: 'Loại TK: Vãng lai 当座 (○)', format: 'mark', appliesTo: ALL_TEMPLATES },
      { id: 'yucho_kigo', label: 'Yucho Bank: Kigo 記号 (5 số - VD: 10120)', appliesTo: ALL_TEMPLATES },
      { id: 'yucho_bango', label: 'Yucho Bank: Bango 番号 (7 số - VD: 1234567)', appliesTo: ALL_TEMPLATES },
      { id: 'yucho_dash', label: 'Yucho Bank: Dấu gạch ngang (-)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('account_dig', 13, 'Số TK Ngân hàng Thường/Yucho (13 ô dạt sát phải)'),
      ...generateSplitTags('bank', 7, 'Số TK Ngân hàng Thường (7 ô)'),
      ...generateSplitTags('yucho_kigo', 5, 'Yucho Kigo (5 ô)'),
      ...generateSplitTags('yucho_bango', 7, 'Yucho Bango (7 ô)'),
      ...generateSplitTags('swift', 11, 'SWIFT'),
      ...generateSplitTags('bankInstitutionCode', 4, 'Mã Ngân Hàng (金融機関コード)'),
      ...generateSplitTags('branchCode', 3, 'Mã Chi Nhánh (支店コード)'),
      { id: 'bank_account_type_1_mark', label: 'Loại TK: Thường (普通)', format: 'mark', appliesTo: ['don_xin_lan_1'], required: true },
      { id: 'bank_account_type_2_mark', label: 'Loại TK: Vãng lai (当座)', format: 'mark', appliesTo: ['don_xin_lan_1'] },
    ]
  },
  {
    name: '5. Lịch sử làm việc',
    tags: Array.from({ length: 5 }).flatMap((_, i) => [
      { id: `workHistory_${i+1}_companyName`, label: `Cty ${i+1}: Tên`, appliesTo: ['don_xin_lan_1'] },
      { id: `workHistory_${i+1}_companyAddress`, label: `Cty ${i+1}: Địa chỉ`, appliesTo: ['don_xin_lan_1'] },
      { id: `workHistory_${i+1}_start_full`, label: `Cty ${i+1} BĐ (Nguyên khối YYYY/MM/DD)`, appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags(`workHistory_${i+1}_start_y`, 4, `Cty ${i+1} Năm BĐ`, ['don_xin_lan_1']),
      ...generateSplitTags(`workHistory_${i+1}_start_m`, 2, `Cty ${i+1} Tháng BĐ`, ['don_xin_lan_1']),
      ...generateSplitTags(`workHistory_${i+1}_start_d`, 2, `Cty ${i+1} Ngày BĐ`, ['don_xin_lan_1']),
      { id: `workHistory_${i+1}_end_full`, label: `Cty ${i+1} KT (Nguyên khối YYYY/MM/DD)`, appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags(`workHistory_${i+1}_end_y`, 4, `Cty ${i+1} Năm KT`, ['don_xin_lan_1']),
      ...generateSplitTags(`workHistory_${i+1}_end_m`, 2, `Cty ${i+1} Tháng KT`, ['don_xin_lan_1']),
      ...generateSplitTags(`workHistory_${i+1}_end_d`, 2, `Cty ${i+1} Ngày KT`, ['don_xin_lan_1']),
      { id: `workHistory_${i+1}_type_1_mark`, label: `Cty ${i+1}: Quốc dân (○)`, appliesTo: ['don_xin_lan_1'] },
      { id: `workHistory_${i+1}_type_2_mark`, label: `Cty ${i+1}: LĐXH (○)`, appliesTo: ['don_xin_lan_1'] },
      { id: `workHistory_${i+1}_type_3_mark`, label: `Cty ${i+1}: Hàng hải (○)`, appliesTo: ['don_xin_lan_1'] },
      { id: `workHistory_${i+1}_type_4_mark`, label: `Cty ${i+1}: Hỗ tương (○)`, appliesTo: ['don_xin_lan_1'] },
    ])
  },
  {
    name: '6. Người đại diện Thuế (Cá nhân - Form 3 & Bảng Lần 2)',
    tags: [
      { id: 'taxOfficeName', label: 'Tên Cục Thuế', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'bang_1_2', 'bang_3'] },
      { id: 'taxOfficeAddress', label: 'Địa chỉ Cục Thuế', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'bang_1_2', 'bang_3'] },
      ...generateSplitTags('tax_post', 7, 'Mã BĐ Thuế', ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'bang_1_2', 'bang_3']),
      { id: 'taxRep_fullName', label: 'Người đại diện thuế (Cá nhân): Tên', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'bang_1_2', 'bang_3'] },
      { id: 'taxRep_fullNameKana', label: 'Người đại diện thuế (Cá nhân): Tên Furigana', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'bang_1_2', 'bang_3'] },
      { id: 'taxRep_phone', label: 'Người đại diện thuế (Cá nhân): SĐT (Nguyên khối)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      ...generateSplitTags('taxRep_phone', 11, 'Người đại diện thuế: SĐT', ['giay_uy_thac_lan_2', 'nouzeikanrinin']),
      { id: 'taxRep_postalCodeFormat', label: 'Người đại diện thuế (Cá nhân): Mã BĐ (Nguyên khối)', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      ...generateSplitTags('taxRep_post', 7, 'Người đại diện thuế: Mã BĐ (Ô taxRep_post)', ['giay_uy_thac_lan_2', 'nouzeikanrinin']),
      ...generateSplitTags('rep_post', 7, 'Người đại diện thuế: Mã BĐ (Ô rep_post)', ['giay_uy_thac_lan_2', 'nouzeikanrinin']),
      { id: 'taxRep_address', label: 'Người đại diện thuế (Cá nhân): Địa chỉ', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin', 'bang_1_2', 'bang_3'] },
      { id: 'taxRep_relationship', label: 'Người đại diện thuế (Cá nhân): Quan hệ với Khách hàng', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
      { id: 'taxRep_occupation', label: 'Người đại diện thuế: Nghề nghiệp', appliesTo: ['giay_uy_thac_lan_2', 'nouzeikanrinin'] },
    ]
  },
  {
    name: '7. Tính Thuế & Ô Chữ Số Ô Lề Phải (Bảng 1, 2, 3)',
    tags: [
      { id: 'totalExpectedJpy', label: 'Tổng tiền Nenkin (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'withheldTax', label: 'Thuế đã khấu trừ (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'received1stJpy', label: 'Tiền nhận Lần 1 (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'received2ndJpy', label: 'Tiền nhận Lần 2 (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'tax2ndJpy', label: 'Thuế Lần 2 (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'totalGeneralTax', label: 'Tổng số thuế thông thường (12)', appliesTo: ['bang_3'] },
      { id: 'retirementDeductionAmount', label: 'Mức miễn giảm thu nhập (退職所得控除額)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'taxableRetirementIncome', label: 'Thu nhập chịu thuế (76)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'calculatedTax', label: 'Thuế đã tính (49 / 92)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'calculatedTax93', label: 'Thuế đã tính (93)', appliesTo: ['bang_3'] },
      { id: 'tokureiTekio', label: '特例適用条文 (Nguyên khối)', appliesTo: ['bang_3'] },
      ...generateSplitTags('tokureiTekio', 3, '特例適用 (3 ô)', ['bang_3']),
      { id: 'tokureiShohoMark', label: 'Khoanh chọn 特例適用: 所法 (○)', format: 'mark', appliesTo: ['bang_3'] },
      { id: 'furikae_danzoku_mark', label: 'Khoanh chọn 振替継続希望 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'furikae_aoiro_mark', label: 'Khoanh chọn 種類: 青色 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'furikae_shiro_mark', label: 'Khoanh chọn 種類: 白色 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'bunri_mark', label: 'Khoanh chọn 種類: 分離課税 / 分離 (○)', format: 'mark', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'furikae_sonshitsu_mark', label: 'Khoanh chọn 種類: 損失 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'furikae_shusei_mark', label: 'Khoanh chọn 種類: 修正 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'furikae_tokunou_mark', label: 'Khoanh chọn 種類: 特農 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'furikae_tokuten_mark', label: 'Khoanh chọn 種類: 特典 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'furikae_tokurei_mark', label: 'Khoanh chọn 種類: 特例 (○)', format: 'mark', appliesTo: ['bang_1_2'] },
      ...generateSplitTags('withheldTax_dig', 7, 'Thuế đã khấu trừ (Ô 48 - 7 ô)', ['bang_1_2', 'bang_3']),
      ...generateSplitTags('calculatedTax_dig', 7, 'Thuế đã tính (Ô 49 - 7 ô)', ['bang_1_2', 'bang_3']),
      ...generateSplitTags('refundAmount_dig', 7, 'Tiền hoàn thuế (Ô 52 - 7 ô)', ['bang_1_2', 'bang_3']),
      ...generateSplitTags('totalExpectedJpy_dig', 9, 'Tổng tiền Nenkin (Ô 二/退職 - 9 ô)', ['bang_1_2', 'bang_3']),
      ...generateSplitTags('calculatedTax93_dig', 7, 'Thuế đã tính (Ô 93 - 7 ô)', ['bang_3']),
      ...generateSplitTags('totalGeneralTax_dig', 7, 'Tổng thuế (Ô 12 - 7 ô)', ['bang_3']),
      ...generateSplitTags('taxableRetirementIncome_dig', 7, 'Thu nhập chịu thuế (Ô 76 - 7 ô)', ['bang_3']),
    ]
  },
  {
    name: '8. Thông tin diễn giải thu nhập Bảng 1-2 (第二表 所得の内訳)',
    tags: [
      { id: 'lumpSumWithdrawalNumber', label: 'Số QĐ thoái nhất thời kim (整理番号, Nguyên khối)', appliesTo: ['bang_1_2', 'bang_3'] },
      ...generateSplitTags('lumpSumNum', 14, 'Số QĐ (整理番号)', ['bang_1_2', 'bang_3']),
      { id: 'coverageMonths', label: 'Số tháng đóng bảo hiểm (被保険者期間の月数)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'lastCoverageMonth', label: 'Tháng cuối đóng BH (最終月)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'averageStandardRemuneration', label: 'Mức lương tiêu chuẩn TB (平均標準報酬額)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'paymentsMultiplier', label: 'Hệ số chi trả (支給率)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'noticeDate_era_jp', label: 'Ngày QĐ: Thời đại (元号)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'noticeDate_era_yr', label: 'Ngày QĐ: Năm Nhật (Nguyên khối)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'taxRep_bankName', label: 'NH đại diện thuế: Tên NH', appliesTo: ['bang_1_2'] },
      { id: 'taxRep_branchName', label: 'NH đại diện thuế: Tên chi nhánh', appliesTo: ['bang_1_2'] },
      { id: 'taxRep_accountNumber', label: 'NH đại diện thuế: Số TK (Nguyên khối)', appliesTo: ['bang_1_2'] },
      ...generateSplitTags('taxRep_account', 7, 'NH đại diện thuế: Số TK (7 ô)', ['bang_1_2']),
      ...generateSplitTags('taxRep_account_dig', 13, 'NH đại diện thuế: Số TK Thường/Yucho (13 ô)', ['bang_1_2']),
      { id: 'taxRep_accountName', label: 'NH đại diện thuế: Tên TK', appliesTo: ['bang_1_2'] },
      { id: 'taxRep_accountType_1_mark', label: 'NH đại diện thuế: TK Thường (普通) ○', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'taxRep_accountType_2_mark', label: 'NH đại diện thuế: TK Tiết kiệm (当座) ○', format: 'mark', appliesTo: ['bang_1_2'] },
      { id: 'taxRep_yucho_kigo', label: 'NH đại diện thuế (Yucho): Kigo 記号 (5 số)', appliesTo: ['bang_1_2'] },
      { id: 'taxRep_yucho_bango', label: 'NH đại diện thuế (Yucho): Bango 番号 (7 số)', appliesTo: ['bang_1_2'] },
      ...generateSplitTags('taxRep_yucho_kigo', 5, 'NH đại diện thuế Yucho Kigo (5 ô)', ['bang_1_2']),
      ...generateSplitTags('taxRep_yucho_bango', 7, 'NH đại diện thuế Yucho Bango (7 ô)', ['bang_1_2']),
      { id: 'incomeTypeName', label: 'Loại thu nhập: 退職', appliesTo: ['bang_1_2'] },
      { id: 'incomeItemName', label: 'Hạng mục thu nhập: 脱退一時金', appliesTo: ['bang_1_2'] },
      { id: 'incomePayerName', label: 'Tên cơ quan chi trả: 日本年金機構', appliesTo: ['bang_1_2'] },
      { id: 'incomePayerAddress', label: 'Địa chỉ cơ quan chi trả: 東京都杉並区高円寺南5-4-5', appliesTo: ['bang_1_2'] },
      { id: 'incomeSourceAmount', label: 'Nguồn thu nhập (第二表): Thu nhập (¥)', appliesTo: ['bang_1_2'] },
      { id: 'incomeSourceWithheld', label: 'Nguồn thu nhập (第二表): Thuế KT (¥)', appliesTo: ['bang_1_2'] },
    ]
  }
];

export function getTagsForTemplate(templateId: string): FieldGroup[] {
  return TEMPLATE_FIELD_CATALOG.map(group => {
    const filteredTags = group.tags.filter(tag => tag.appliesTo.includes('*') || tag.appliesTo.includes(templateId));
    return { ...group, tags: filteredTags };
  }).filter(group => group.tags.length > 0);
}

export function getRequiredTags(templateId: string, context?: any): TemplateField[] {
  const fields: TemplateField[] = [];
  getTagsForTemplate(templateId).forEach(g => {
    fields.push(...g.tags.filter(t => {
      if (typeof t.required === 'function') {
        return context ? t.required(context) : true;
      }
      return !!t.required;
    }));
  });
  return fields;
}

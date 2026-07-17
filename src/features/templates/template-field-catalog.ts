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

const generateSplitTags = (prefix: string, count: number, labelPrefix: string, appliesTo: string[] = ALL_TEMPLATES, required = false): TemplateField[] => 
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
      { id: 'fullName', label: 'Khách hàng (Người ủy quyền): Họ và tên (Nguyên khối)', appliesTo: ALL_TEMPLATES, required: true },
      { id: 'fullName_kata', label: 'Khách hàng (Người ủy quyền): Furigana (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'lastName', label: 'Khách hàng: Họ (Lần 1)', appliesTo: ['don_xin_lan_1'] },
      { id: 'firstName', label: 'Khách hàng: Tên (Lần 1)', appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags('lastName', 15, 'Khách hàng: Họ (Ký tự)'),
      ...generateSplitTags('firstName', 15, 'Khách hàng: Tên (Ký tự)'),
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
      ...generateSplitTags('phone', 11, 'Khách hàng: SĐT'),
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
      { id: 'overseasCountry', label: 'Quốc gia hải ngoại', appliesTo: ['don_xin_lan_1'] },
      { id: 'overseasStreet', label: 'Số nhà, đường hải ngoại', appliesTo: ['don_xin_lan_1'] },
      { id: 'overseasCity', label: 'Thành phố hải ngoại', appliesTo: ['don_xin_lan_1'] },
      { id: 'overseasProvince', label: 'Tỉnh/Bang hải ngoại', appliesTo: ['don_xin_lan_1'] },
      { id: 'overseasPostalCode', label: 'Mã bưu điện hải ngoại', appliesTo: ['don_xin_lan_1'] },
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
    name: '2b. Đại lý nhận ủy quyền (Form 2) & Đại diện thuế (Form 3)',
    tags: [
      { id: 'agentName', label: 'Đại lý nhận ủy quyền (Công ty): Tên', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'agentAddress', label: 'Đại lý nhận ủy quyền (Công ty): Địa chỉ', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'agentPhone', label: 'Đại lý nhận ủy quyền (Công ty): SĐT', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'delegationPurpose', label: 'Đại lý nhận ủy quyền (Công ty): Nội dung ủy thác', appliesTo: ['ininjyo_yoshiki_lan_1'] },
      { id: 'taxRep_appoint_mark', label: 'Đại diện thuế: Chọn 選任 (○)', format: 'mark', appliesTo: ['nouzeikanrinin'], required: true },
      { id: 'taxRep_dismiss_mark', label: 'Đại diện thuế: Hủy 解任 (○)', format: 'mark', appliesTo: ['nouzeikanrinin'] },
    ]
  },
  {
    name: '3. Ngày tháng',
    tags: [
      { id: 'dob_y', label: 'Năm sinh Tây (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_m', label: 'Tháng sinh (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_d', label: 'Ngày sinh (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_era', label: 'Thời đại (Romaji)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_era_jp', label: 'Thời đại (Kanji)', appliesTo: ALL_TEMPLATES },
      { id: 'dob_era_yr', label: 'Năm sinh Nhật (Nguyên khối)', appliesTo: ALL_TEMPLATES },
      ...generateSplitTags('dob_y', 4, 'Năm sinh Tây'),
      ...generateSplitTags('dob_m', 2, 'Tháng sinh'),
      ...generateSplitTags('dob_d', 2, 'Ngày sinh'),
      ...generateSplitTags('dob_era_yr', 2, 'Năm sinh Nhật'),
      
      { id: 'departureDate_y', label: 'Năm xuất cảnh (Nguyên khối)', appliesTo: ['nouzeikanrinin', 'don_xin_lan_1'] },
      { id: 'departureDate_m', label: 'Tháng xuất cảnh (Nguyên khối)', appliesTo: ['nouzeikanrinin', 'don_xin_lan_1'] },
      { id: 'departureDate_d', label: 'Ngày xuất cảnh (Nguyên khối)', appliesTo: ['nouzeikanrinin', 'don_xin_lan_1'] },
      ...generateSplitTags('departureDate_y', 4, 'Năm xuất cảnh', ['nouzeikanrinin', 'don_xin_lan_1']),
      ...generateSplitTags('departureDate_m', 2, 'Tháng xuất cảnh', ['nouzeikanrinin', 'don_xin_lan_1']),
      ...generateSplitTags('departureDate_d', 2, 'Ngày xuất cảnh', ['nouzeikanrinin', 'don_xin_lan_1']),
      
      { id: 'applyDate_y', label: 'Năm xin Nenkin (Nguyên khối)', appliesTo: ['don_xin_lan_1'] },
      { id: 'applyDate_m', label: 'Tháng xin Nenkin (Nguyên khối)', appliesTo: ['don_xin_lan_1'] },
      { id: 'applyDate_d', label: 'Ngày xin Nenkin (Nguyên khối)', appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags('applyDate_y', 4, 'Năm xin Nenkin', ['don_xin_lan_1']),
      ...generateSplitTags('applyDate_m', 2, 'Tháng xin Nenkin', ['don_xin_lan_1']),
      ...generateSplitTags('applyDate_d', 2, 'Ngày xin Nenkin', ['don_xin_lan_1']),
      { id: 'applyDate_era_yr', label: 'Năm xin Nenkin Nhật (Nguyên khối)', appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags('applyDate_era_yr', 2, 'Năm xin Nenkin Nhật', ['don_xin_lan_1']),
      
      { id: 'noticeDate_y', label: 'Năm nhận thông báo (Nguyên khối)', appliesTo: ['bang_3'] },
      { id: 'noticeDate_m', label: 'Tháng nhận thông báo (Nguyên khối)', appliesTo: ['bang_3'] },
      { id: 'noticeDate_d', label: 'Ngày nhận thông báo (Nguyên khối)', appliesTo: ['bang_3'] },
      ...generateSplitTags('noticeDate_y', 4, 'Năm nhận thông báo', ['bang_3']),
      ...generateSplitTags('noticeDate_m', 2, 'Tháng nhận thông báo', ['bang_3']),
      ...generateSplitTags('noticeDate_d', 2, 'Ngày nhận thông báo', ['bang_3']),
      
      ...generateSplitTags('taxYear_era_yr', 2, 'Năm khai thuế (Nhật)'),
      
      { id: 'today_era_jp', label: 'Ngày hôm nay lúc in (元号)', appliesTo: ALL_TEMPLATES },
      { id: 'today_era_yr', label: 'Ngày hôm nay lúc in (年)', appliesTo: ALL_TEMPLATES },
      { id: 'today_m', label: 'Ngày hôm nay lúc in (tháng)', appliesTo: ALL_TEMPLATES },
      { id: 'today_d', label: 'Ngày hôm nay lúc in (ngày)', appliesTo: ALL_TEMPLATES },
      
      { id: 'doc_date_era_jp', label: 'Ngày tạo hồ sơ (元号)', appliesTo: ['ininjyo_yoshiki_lan_1', 'nouzeikanrinin', 'bang_1_2', 'bang_3', 'giay_uy_thac_lan_2'] },
      { id: 'doc_date_era_yr', label: 'Ngày tạo hồ sơ (年)', appliesTo: ['ininjyo_yoshiki_lan_1', 'nouzeikanrinin'] },
      { id: 'doc_date_m', label: 'Ngày tạo hồ sơ (tháng)', appliesTo: ['ininjyo_yoshiki_lan_1', 'nouzeikanrinin'] },
      { id: 'doc_date_d', label: 'Ngày tạo hồ sơ (ngày)', appliesTo: ['ininjyo_yoshiki_lan_1', 'nouzeikanrinin'] },
      { id: 'applicantSignature', label: 'Chữ ký người làm đơn', appliesTo: ['don_xin_lan_1'], required: true },
      { id: 'principalSignature', label: 'Chữ ký người ủy quyền', appliesTo: ['ininjyo_yoshiki_lan_1'], required: true },
      { id: 'applicationAcknowledgement_mark', label: 'Xác nhận nội dung đơn (○)', format: 'mark', appliesTo: ['don_xin_lan_1'], required: true },
    ]
  },
  {
    name: '4. Tài khoản Ngân hàng',
    tags: [
      { id: 'bankName', label: 'Tên Ngân hàng', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'branchName', label: 'Tên chi nhánh', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'bankBranchAddress', label: 'Địa chỉ chi nhánh', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'bankBranchCity', label: 'TP chi nhánh', appliesTo: ['don_xin_lan_1'] },
      { id: 'bankCountry', label: 'Quốc gia NH', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'accountNumber', label: 'Số tài khoản (Nguyên khối)', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'] },
      { id: 'accountName', label: 'Tên tài khoản (Romaji)', appliesTo: ['don_xin_lan_1'] },
      { id: 'accountNameKatakana', label: 'Tên tài khoản (Katakana)', appliesTo: ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1'], required: (ctx) => ctx.bankCountry === 'JP' || ctx.bankCountry === 'Nhật Bản' },
      { id: 'swiftCode', label: 'SWIFT Code (Nguyên khối)', appliesTo: ['don_xin_lan_1'] },
      ...generateSplitTags('bank', 7, 'Số TK', ['don_xin_lan_1']),
      ...generateSplitTags('swift', 11, 'SWIFT', ['don_xin_lan_1']),
      ...generateSplitTags('bankInstitutionCode', 4, 'Mã Ngân Hàng (金融機関コード)', ['don_xin_lan_1'], (ctx) => ctx.bankCountry === 'JP' || ctx.bankCountry === 'Nhật Bản'),
      ...generateSplitTags('branchCode', 3, 'Mã Chi Nhánh (支店コード)', ['don_xin_lan_1'], (ctx) => ctx.bankCountry === 'JP' || ctx.bankCountry === 'Nhật Bản'),
      { id: 'bank_account_type', label: 'Loại tài khoản (Text)', appliesTo: ['don_xin_lan_1'] },
      { id: 'bank_account_type_1_mark', label: 'Loại TK: Thường (普通)', format: 'mark', appliesTo: ['don_xin_lan_1'], required: true },
      { id: 'bank_account_type_2_mark', label: 'Loại TK: Tiết kiệm (当座)', format: 'mark', appliesTo: ['don_xin_lan_1'] },
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
      { id: 'taxOfficeName', label: 'Tên Cục Thuế', appliesTo: ['nouzeikanrinin', 'bang_1_2', 'bang_3', 'giay_uy_thac_lan_2'] },
      { id: 'taxOfficeAddress', label: 'Địa chỉ Cục Thuế', appliesTo: ['nouzeikanrinin', 'bang_1_2', 'bang_3'] },
      ...generateSplitTags('tax_post', 7, 'Mã BĐ Thuế', ['nouzeikanrinin', 'bang_1_2', 'bang_3']),
      { id: 'taxRep_fullName', label: 'Người đại diện thuế (Cá nhân): Tên', appliesTo: ['nouzeikanrinin', 'bang_1_2', 'bang_3', 'giay_uy_thac_lan_2'] },
      { id: 'taxRep_fullNameKana', label: 'Người đại diện thuế (Cá nhân): Tên Furigana', appliesTo: ['nouzeikanrinin'] },
      { id: 'taxRep_phone', label: 'Người đại diện thuế (Cá nhân): SĐT (Nguyên khối)', appliesTo: ['nouzeikanrinin'] },
      ...generateSplitTags('taxRep_phone', 11, 'Người đại diện thuế: SĐT', ['nouzeikanrinin']),
      { id: 'taxRep_postalCodeFormat', label: 'Người đại diện thuế (Cá nhân): Mã BĐ (Nguyên khối)', appliesTo: ['nouzeikanrinin'] },
      ...generateSplitTags('taxRep_post', 7, 'Người đại diện thuế: Mã BĐ', ['nouzeikanrinin']),
      { id: 'taxRep_address', label: 'Người đại diện thuế (Cá nhân): Địa chỉ', appliesTo: ['nouzeikanrinin', 'bang_1_2', 'bang_3', 'giay_uy_thac_lan_2'] },
      { id: 'taxRep_relationship', label: 'Người đại diện thuế (Cá nhân): Quan hệ với Khách hàng', appliesTo: ['nouzeikanrinin'] },
    ]
  },
  {
    name: '7. Tính Thuế (Bảng 1, 2, 3)',
    tags: [
      { id: 'totalExpectedJpy', label: 'Tổng tiền Nenkin (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'withheldTax', label: 'Thuế đã khấu trừ (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'received1stJpy', label: 'Tiền nhận Lần 1 (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'received2ndJpy', label: 'Tiền nhận Lần 2 (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'tax2ndJpy', label: 'Thuế Lần 2 (¥)', appliesTo: ['bang_1_2', 'bang_3'] },
      { id: 'retirementDeductionAmount', label: 'Mức miễn giảm thu nhập', appliesTo: ['bang_1_2'] },
      { id: 'taxableRetirementIncome', label: 'Thu nhập chịu thuế (76)', appliesTo: ['bang_1_2'] },
      { id: 'calculatedTax', label: 'Thuế đã tính (92)', appliesTo: ['bang_1_2'] },
      { id: 'refundAmount', label: 'Tiền xin hoàn (114)', appliesTo: ['bang_1_2'] },
      { id: 'serviceFeeJpy', label: 'Phí dịch vụ (¥)', appliesTo: ['bang_1_2'] },
      { id: 'exchangeRate', label: 'Tỷ giá', appliesTo: ['bang_1_2'] },
      { id: 'serviceFeeVnd', label: 'Phí dịch vụ (VNĐ)', appliesTo: ['bang_1_2'] },
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

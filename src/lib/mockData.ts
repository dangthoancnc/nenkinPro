export const MOCK_DATA: Record<string, string> = {
  // 1. Thông tin cá nhân
  fullName: 'NGUYEN VAN A',
  fullNameFurigana: 'グエン ヴァン A',
  lastName: 'NGUYEN',
  firstName: 'VAN A',
  sex: 'Nam',
  nationality: 'VIET NAM',
  myNumber: '123456789012',
  nenkinNumber: '1234567890',
  phone: '09012345678',
  passportNumber: 'TN1234567',
  occupation: 'Kỹ sư IT',
  headOfHouseholdName: 'NGUYEN VAN A',
  relationshipToHead: 'Bản thân',
  
  // 2. Địa chỉ
  address: '東京都新宿区百人町1-2-3',
  postalCodeFormat: '1690073',
  overseasCountry: 'VIET NAM',
  overseasStreet: 'Số 1, Phố Chùa Láng',
  overseasCity: 'Quận Đống Đa',
  overseasProvince: 'Hà Nội',
  overseasPostalCode: '100000',
  permResDate_full: '2020/05/15',
  permResDate_y: '2020',
  permResDate_m: '05',
  permResDate_d: '15',
  
  // 3. Ngày tháng
  dob_y: '1995',
  dob_m: '08',
  dob_d: '15',
  dob_era: 'Heisei',
  dob_era_jp: '平成',
  dob_era_yr: '07', // 1995
  departureDate_y: '2026',
  departureDate_m: '01',
  departureDate_d: '10',
  applyDate_y: '2026',
  applyDate_m: '02',
  applyDate_d: '20',
  applyDate_era_yr: '08', // Reiwa 8
  noticeDate_y: '2026',
  noticeDate_m: '03',
  noticeDate_d: '01',
  taxYear_era_yr: '08', // Reiwa 8
  taxYear_era_yr_unit: '8', // Reiwa 8 unit digit for preprinted 令和 0
  
  // 4. Tài khoản ngân hàng
  bankName: 'Vietcombank',
  branchName: 'Chi nhánh Thăng Long',
  bankBranchAddress: 'Số 2 Phố Chùa Láng',
  bankBranchCity: 'Hà Nội',
  bankCountry: 'VIET NAM',
  accountNumber: '0491000123456',
  accountName: 'NGUYEN VAN A',
  accountNameKatakana: 'グエン ヴァン A',
  swiftCode: 'BFTVVNVX',
  
  // 6. Nộp thuế & Đại diện (Đại diện thuế - Cá nhân)
  taxOfficeName: 'Shinjuku',
  taxOfficeAddress: 'Tokyo-to Shinjuku-ku',
  taxRep_fullName: 'TRAN THI B',
  taxRep_fullNameKana: 'トラン ティ B',
  taxRep_phone: '08098765432',
  taxRep_postalCodeFormat: '1690074',
  taxRep_address: '東京都新宿区百人町1-2-4',
  taxRep_relationship: 'Vợ',

  // 6b. Đại lý nhận ủy quyền (Công ty - Form 2)
  agentName: 'CÔNG TY CỔ PHẦN NENKINPRO',
  agentAddress: 'Tōkyō-to, Shinjuku-ku, Hyakuninchō 1-2-4',
  agentPhone: '03-0000-0000',
  delegationPurpose: 'Đại diện làm thủ tục nhận tiền Nenkin và các thủ tục liên quan',
  agentRelationship: 'Đại lý ủy quyền',
  
  // 7. Tính Thuế (Số tiền nguyên khối có dấu phẩy phân cách hàng nghìn chuẩn Nhật)
  totalExpectedJpy: '5,000,000',
  withheldTax: '1,021,000',
  received1stJpy: '3,979,000',
  received2ndJpy: '1,021,000',
  tax2ndJpy: '0',
  retirementDeductionAmount: '4,000,000',
  taxableRetirementIncome: '1,000,000',
  calculatedTax: '1,002,500',
  refundAmount: '1,099,600',
  serviceFeeJpy: '10,000',
  exchangeRate: '165',
  serviceFeeVnd: '1,650,000',

  // Bang 1_2 extra fields
  lumpSumWithdrawalNumber: '12345678901234',
  coverageMonths: '36',
  lastCoverageMonth: '2024/03',
  averageStandardRemuneration: '220,000',
  paymentsMultiplier: '2.8',
  noticeDate_era_jp: '令和',
  noticeDate_era_yr: '07',
  // Tax rep bank
  taxRep_bankName: 'みずほ銀行',
  taxRep_branchName: '新宿支店',
  taxRep_accountNumber: '1234567',
  taxRep_accountName: 'トラン ティ B',
  taxRep_accountType_1_mark: '○',
  taxRep_accountType_2_mark: '',
  // 第二表 income source
  incomeSourceName: '日本年金機構',
  incomeTypeName: '退職',
  incomeSourceAmount: '5,000,000',
  incomeSourceWithheld: '1,021,000',
};

// Generate split tags
const generateSplitValues = (prefix: string, value: string, count: number) => {
  for (let i = 0; i < count; i++) {
    if (i < value.length) {
      MOCK_DATA[`${prefix}_${i + 1}`] = value[i];
    } else {
      MOCK_DATA[`${prefix}_${i + 1}`] = '';
    }
  }
};

const generateSplitValuesRight = (prefix: string, value: string, count: number = 10) => {
  const digits = value.split('');
  const padCount = Math.max(0, count - digits.length);
  for (let i = 1; i <= count; i++) {
    const digitIndex = i - 1 - padCount;
    MOCK_DATA[`${prefix}_${i}`] = (digitIndex >= 0 && digitIndex < digits.length) ? digits[digitIndex] : '';
  }
};

generateSplitValues('fullName_kata', 'グエン ヴァン A', 14);
generateSplitValues('my_num', '123456789012', 12);
generateSplitValues('nenkin', '1234567890', 10);
generateSplitValues('phone', '09012345678', 11);
generateSplitValues('post', '1690073', 7);
generateSplitValues('tax_post', '1690073', 7);
generateSplitValues('taxRep_phone', '08098765432', 11);
generateSplitValues('taxRep_post', '1690074', 7);
generateSplitValues('bank', '1234567', 7);
generateSplitValues('swift', 'BFTVVNVX', 11);

// Right aligned monetary split digits for boxes 48, 49, 52 (7 full slots - no empty slots in mock preview)
generateSplitValuesRight('withheldTax_dig', '1021000', 7);
generateSplitValuesRight('calculatedTax_dig', '1002500', 7);
generateSplitValuesRight('refundAmount_dig', '1099600', 7);

// Dates split tags
generateSplitValues('dob_y', '1995', 4);
generateSplitValues('dob_m', '08', 2);
generateSplitValues('dob_d', '15', 2);
generateSplitValues('dob_era_yr', '07', 2);
generateSplitValues('permResDate_y', '2020', 4);
generateSplitValues('permResDate_m', '05', 2);
generateSplitValues('permResDate_d', '15', 2);
generateSplitValues('departureDate_y', '2026', 4);
generateSplitValues('departureDate_m', '01', 2);
generateSplitValues('departureDate_d', '10', 2);
generateSplitValues('applyDate_y', '2026', 4);
generateSplitValues('applyDate_m', '02', 2);
generateSplitValues('applyDate_d', '20', 2);
generateSplitValues('applyDate_era_yr', '08', 2);
generateSplitValues('noticeDate_y', '2026', 4);
generateSplitValues('noticeDate_m', '03', 2);
generateSplitValues('noticeDate_d', '01', 2);
generateSplitValues('taxYear_era_yr', '08', 2);

// Today & Doc Date mock values
MOCK_DATA['today_era_jp'] = '令和';
MOCK_DATA['today_era_yr'] = '08';
MOCK_DATA['today_m'] = '02';
MOCK_DATA['today_d'] = '15';
generateSplitValues('today_era_yr', '08', 2);
generateSplitValues('today_m', '02', 2);
generateSplitValues('today_d', '15', 2);
generateSplitValues('today_yymmdd', '080215', 6);

MOCK_DATA['doc_date_era_jp'] = '令和';
MOCK_DATA['doc_date_era_yr'] = '08';
MOCK_DATA['doc_date_m'] = '02';
MOCK_DATA['doc_date_d'] = '15';
generateSplitValues('doc_date_era_yr', '08', 2);
generateSplitValues('doc_date_m', '02', 2);
generateSplitValues('doc_date_d', '15', 2);
generateSplitValues('doc_date_yymmdd', '080215', 6);

// Marks
MOCK_DATA['permRes_YES_mark'] = '○';
MOCK_DATA['permRes_NO_mark'] = '';
MOCK_DATA['sex_M_mark'] = '○';
MOCK_DATA['sex_F_mark'] = '';
MOCK_DATA['dob_era_code'] = '3'; // Showa
MOCK_DATA['bank_type_bank_mark'] = '○';
MOCK_DATA['bank_type_shiten_mark'] = '○';
MOCK_DATA['account_type_futsu_mark'] = '○';
MOCK_DATA['furikae_danzoku_mark'] = '○';
MOCK_DATA['furikae_aoiro_mark'] = '';
MOCK_DATA['furikae_shiro_mark'] = '○';
MOCK_DATA['bunri_mark'] = '○';
MOCK_DATA['furikae_sonshitsu_mark'] = '';
MOCK_DATA['furikae_shusei_mark'] = '';
MOCK_DATA['furikae_tokunou_mark'] = '';
MOCK_DATA['furikae_tokuten_mark'] = '';
MOCK_DATA['furikae_tokurei_mark'] = '';

// Phone groups
MOCK_DATA['phone_group_1'] = '090';
MOCK_DATA['phone_group_2'] = '1234';
MOCK_DATA['phone_group_3'] = '5678';

// Yucho Bank & Unified Bank Account Digits
MOCK_DATA['yucho_kigo'] = '10120';
generateSplitValues('yucho_kigo', '10120', 5);
MOCK_DATA['yucho_bango'] = '1234567';
generateSplitValues('yucho_bango', '1234567', 7);
MOCK_DATA['yucho_dash'] = '-';
MOCK_DATA['yucho_kigo_bango'] = '10120-1234567';
generateSplitValues('account_dig', '10120-1234567', 13);

// Income Breakdown (第二表)
MOCK_DATA['incomeTypeName'] = '退職';
MOCK_DATA['incomeItemName'] = '脱退一時金';
MOCK_DATA['incomePayerName'] = '日本年金機構';
MOCK_DATA['incomePayerAddress'] = '東京都杉並区高円寺南5-4-5';

// Right-aligned Monetary Split Digits (7 box grid)
function generateSplitDigitsRight(prefix: string, valueStr: string, count = 7) {
  const digits = valueStr.replace(/\D/g, '');
  for (let i = 1; i <= count; i++) {
    const offsetFromRight = count - i;
    if (offsetFromRight < digits.length) {
      MOCK_DATA[`${prefix}_${i}`] = digits[digits.length - 1 - offsetFromRight];
    } else {
      MOCK_DATA[`${prefix}_${i}`] = '';
    }
  }
}
generateSplitDigitsRight('withheldTax_dig', '1021000', 7);
generateSplitDigitsRight('calculatedTax_dig', '1002500', 7);
generateSplitDigitsRight('refundAmount_dig', '1099600', 7);
generateSplitValues('fullName_kata', 'グエン ヴァン A', 30);

// Work histories
for (let i = 1; i <= 5; i++) {
  MOCK_DATA[`workHistory_${i}_companyName`] = `Công ty số ${i}`;
  MOCK_DATA[`workHistory_${i}_companyAddress`] = `Địa chỉ Cty số ${i}`;
  MOCK_DATA[`workHistory_${i}_start_full`] = `202${i}/01/01`;
  generateSplitValues(`workHistory_${i}_start_y`, `202${i}`, 4);
  generateSplitValues(`workHistory_${i}_start_m`, '01', 2);
  generateSplitValues(`workHistory_${i}_start_d`, '01', 2);
  MOCK_DATA[`workHistory_${i}_end_full`] = `202${i}/12/31`;
  generateSplitValues(`workHistory_${i}_end_y`, `202${i}`, 4);
  generateSplitValues(`workHistory_${i}_end_m`, '12', 2);
  generateSplitValues(`workHistory_${i}_end_d`, '31', 2);
  MOCK_DATA[`workHistory_${i}_type_1_mark`] = '';
  MOCK_DATA[`workHistory_${i}_type_2_mark`] = '○';
  MOCK_DATA[`workHistory_${i}_type_3_mark`] = '';
  MOCK_DATA[`workHistory_${i}_type_4_mark`] = '';
}

// Alias keys — bridge naming mismatches between mockData and JSON configs
MOCK_DATA['address_jp'] = MOCK_DATA['address'];
MOCK_DATA['fullName_kata'] = MOCK_DATA['fullNameFurigana'];
MOCK_DATA['taxRep_fullName_kata'] = MOCK_DATA['taxRep_fullNameKana'];
MOCK_DATA['taxRep_relation'] = '納税管理人';
MOCK_DATA['bank_name'] = MOCK_DATA['bankName'];
MOCK_DATA['bank_branch'] = MOCK_DATA['branchName'];
MOCK_DATA['bank_account_name'] = MOCK_DATA['accountName'];

// Departure date aliases (mapper → UI bridge)
MOCK_DATA['departure_y'] = MOCK_DATA['departureDate_y'];
MOCK_DATA['departure_m'] = MOCK_DATA['departureDate_m'];
MOCK_DATA['departure_d'] = MOCK_DATA['departureDate_d'];
generateSplitValues('departure_y', MOCK_DATA['departureDate_y'] || '2026', 4);
generateSplitValues('departure_m', MOCK_DATA['departureDate_m'] || '01', 2);
generateSplitValues('departure_d', MOCK_DATA['departureDate_d'] || '10', 2);

// Work history aliases (mapper → UI bridge)
for (let i = 1; i <= 5; i++) {
  MOCK_DATA[`work_company_${i}`] = MOCK_DATA[`workHistory_${i}_companyName`] || '';
  MOCK_DATA[`work_start_${i}`] = MOCK_DATA[`workHistory_${i}_start_full`] || '';
  MOCK_DATA[`work_end_${i}`] = MOCK_DATA[`workHistory_${i}_end_full`] || '';
}
MOCK_DATA['work_last_company'] = MOCK_DATA['workHistory_5_companyName'] || '';
MOCK_DATA['work_last_end_y'] = MOCK_DATA['workHistory_5_end_y'] || '';
MOCK_DATA['work_last_end_m'] = MOCK_DATA['workHistory_5_end_m'] || '';

// Today tags (auto-fill today's date)
const _today = new Date();
MOCK_DATA['today_y'] = String(_today.getFullYear());
MOCK_DATA['today_m'] = String(_today.getMonth() + 1).padStart(2, '0');
MOCK_DATA['today_d'] = String(_today.getDate()).padStart(2, '0');
MOCK_DATA['today_era_jp'] = '令和';
MOCK_DATA['today_era_yr'] = String(_today.getFullYear() - 2018).padStart(2, '0');
MOCK_DATA['today_era_m'] = MOCK_DATA['today_m'];
MOCK_DATA['today_era_d'] = MOCK_DATA['today_d'];

// Doc date tags (use applyDate as default)
MOCK_DATA['doc_date_era_jp'] = '令和';
MOCK_DATA['doc_date_era_yr'] = MOCK_DATA['applyDate_era_yr'] || '08';
MOCK_DATA['doc_date_m'] = MOCK_DATA['applyDate_m'] || '02';
MOCK_DATA['doc_date_d'] = MOCK_DATA['applyDate_d'] || '20';

// Bank account type
MOCK_DATA['bank_account_type'] = '普通';

// Split tags for lumpSumNum
for (let i = 0; i < 14; i++) {
  MOCK_DATA[`lumpSumNum_${i + 1}`] = (MOCK_DATA.lumpSumWithdrawalNumber || '')[i] || '';
}
// Split tags for taxRep_account
for (let i = 0; i < 7; i++) {
  MOCK_DATA[`taxRep_account_${i + 1}`] = (MOCK_DATA.taxRep_accountNumber || '')[i] || '';
}


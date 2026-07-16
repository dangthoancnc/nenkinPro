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
  
  // 6. Nộp thuế & Đại diện
  taxOfficeName: 'Shinjuku',
  taxOfficeAddress: 'Tokyo-to Shinjuku-ku',
  rep_fullName: 'TRAN THI B',
  rep_fullNameKana: 'トラン ティ B',
  rep_phone: '08098765432',
  rep_postalCodeFormat: '1690074',
  rep_address: '東京都新宿区百人町1-2-4',
  rep_relationship: 'Vợ',
  
  // 7. Tính Thuế
  totalExpectedJpy: '500000',
  withheldTax: '102100',
  received1stJpy: '397900',
  received2ndJpy: '102100',
  tax2ndJpy: '0',
  retirementDeductionAmount: '400000',
  taxableRetirementIncome: '50000',
  calculatedTax: '2500',
  refundAmount: '99600',
  serviceFeeJpy: '10000',
  exchangeRate: '165',
  serviceFeeVnd: '1,650,000',
};

// Generate split tags
const generateSplitValues = (prefix: string, value: string, count: number) => {
  const padded = value.padEnd(count, ' ');
  for (let i = 0; i < count; i++) {
    MOCK_DATA[`${prefix}_${i + 1}`] = padded[i] !== ' ' ? padded[i] : '';
  }
};

generateSplitValues('my_num', '123456789012', 12);
generateSplitValues('nenkin', '1234567890', 10);
generateSplitValues('phone', '09012345678', 11);
generateSplitValues('post', '1690073', 7);
generateSplitValues('tax_post', '1690073', 7);
generateSplitValues('rep_phone', '08098765432', 11);
generateSplitValues('rep_post', '1690074', 7);
generateSplitValues('bank', '1234567', 7);
generateSplitValues('swift', 'BFTVVNVX', 11);

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

// Marks
MOCK_DATA['permRes_YES_mark'] = '○';
MOCK_DATA['permRes_NO_mark'] = '';
MOCK_DATA['sex_M_mark'] = '○';
MOCK_DATA['sex_F_mark'] = '';

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
MOCK_DATA['rep_fullName_kata'] = MOCK_DATA['rep_fullNameKana'];
MOCK_DATA['rep_relation'] = '納税管理人';
MOCK_DATA['bank_name'] = MOCK_DATA['bankName'];
MOCK_DATA['bank_branch'] = MOCK_DATA['branchName'];
MOCK_DATA['bank_account_name'] = MOCK_DATA['accountName'];


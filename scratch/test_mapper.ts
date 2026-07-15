/**
 * test_mapper.ts — Test script để kiểm tra documentMapper
 * Chạy: npx ts-node scratch/test_mapper.ts
 * Hoặc: npx tsx scratch/test_mapper.ts
 */

import { mapApplicationToTemplate } from '../src/lib/documentMapper';

const mockApplication = {
  id: 'test-app-001',
  status: 'DRAFT' as const,
  revisionNote: null,
  applyDate: new Date('2024-04-01'),
  sent1stDate: null,
  received1stDate: null,
  sent2ndDate: null,
  received2ndDate: null,
  noticeDate: new Date('2024-06-15'),
  noticeImageUrl: null,
  totalExpectedJpy: 450000,
  received1stJpy: 358290,
  received2ndJpy: 91710,
  tax2ndJpy: 18720,
  withheldTax: 91890,
  serviceFeeJpy: 25000,
  exchangeRate: 165.5,
  serviceFeeVnd: 4137500,
  referralBonusJpy: null,
  referralDiscountJpy: null,
  targetGroup: null,
  taxYear: 5,
  workYears: 3,
  customerId: 'cust-001',
  taxRepresentativeId: 'rep-001',
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: {
    id: 'cust-001',
    code: 'KH001',
    cardNumber: null,
    fullName: 'NGUYEN VAN A',
    dob: new Date('1995-03-25'),
    passwordPin: null,
    status: 'VERIFIED' as const,
    zairyuAddress: '東京都新宿区西新宿2-8-1',
    zairyuRomajiAddress: null,
    postalCode: '160-0023',
    taxOfficeId: 'tax-001',
    nenkinNumber: '1234567890',
    bankName: 'VIETCOMBANK',
    branchName: 'CHI NHANH HA NOI',
    accountNumber: '1234567',
    accountName: 'NGUYEN VAN A',
    swiftCode: 'BFTVVNVX',
    zairyuFrontUrl: null,
    zairyuBackUrl: null,
    passportUrl: null,
    departureStampUrl: null,
    nenkinBookUrl: null,
    bankPassbookUrl: null,
    securityPhotoUrl: null,
    lastName: 'NGUYEN',
    firstName: 'VAN A',
    fullNameFurigana: 'グエン バン エー',
    nationality: 'VIET NAM',
    sex: 'Nam',
    placeOfBirth: null,
    passportIssueDate: null,
    passportExpiryDate: null,
    phone: '09012345678',
    overseasAddress: '123 Pham Van Dong, Ha Noi, VIET NAM',
    overseasCountry: 'VIET NAM',
    hasPermanentResidence: false,
    permanentResidenceDate: null,
    myNumber: '123456789012',
    bankBranchAddress: '25 Ly Thuong Kiet',
    bankBranchCity: 'Ha Noi',
    bankCountry: 'VIET NAM',
    accountNameKatakana: 'グエン バン エー',
    occupation: '製造業',
    departureDate: new Date('2024-12-31'),
    headOfHouseholdName: 'NGUYEN VAN A',
    relationshipToHead: '本人',
    overseasStreet: '123 Pham Van Dong',
    overseasCity: 'Ha Noi',
    overseasProvince: 'Ha Noi',
    overseasPostalCode: '100000',
    createdById: null,
    referralType: null,
    referredByCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    taxOffice: {
      id: 'tax-001',
      name: '新宿税務署',
      romajiName: 'Shinjuku Tax Office',
      address: '東京都新宿区四谷1-6-1',
      romajiAddress: null,
      postalCode: '160-0004',
      phone: '03-3356-5211',
      mapUrl: null,
      websiteUrl: null,
      receptionInfo: null,
      notes: null,
      mailingName: null,
      mailingPostalCode: null,
      mailingAddress: null,
      jurisdiction: null,
      consultationPhone: null,
      generalPhone: null,
    },
    workHistories: [
      {
        id: 'wh-001',
        customerId: 'cust-001',
        companyName: '株式会社サンプル製造',
        companyAddress: '東京都墨田区押上1-1-2',
        startDate: new Date('2021-04-01'),
        endDate: new Date('2024-03-31'),
        pensionType: '厚生年金保険',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
    applications: [],
    transferRequests: [],
    ocrResults: [],
    referrals: [],
  },
  taxRepresentative: {
    id: 'rep-001',
    fullName: 'TRAN THI B',
    fullNameKana: 'トラン ティ ビー',
    address: '大阪府大阪市北区梅田1-1-1',
    postalCode: '530-0001',
    phone: '06-1234-5678',
    myNumber: null,
    relationship: '納税管理人',
    bankName: 'TECHCOMBANK',
    branchName: 'CHI NHANH HCM',
    accountNumber: '9876543',
    accountName: 'TRAN THI B',
    createdAt: new Date(),
    updatedAt: new Date(),
    applications: [],
  },
} as any;

console.log('=== TEST documentMapper.ts ===\n');

const mapped = mapApplicationToTemplate(mockApplication);

// Kiểm tra các trường quan trọng
const checks = [
  // Postal code
  { key: 'post_1', expected: '1' },
  { key: 'post_2', expected: '6' },
  { key: 'post_3', expected: '0' },
  // Bank account
  { key: 'bank_1', expected: '1' },
  { key: 'bank_2', expected: '2' },
  { key: 'bank_7', expected: '7' },
  // MyNumber
  { key: 'my_num_1', expected: '1' },
  { key: 'my_num_12', expected: '2' },
  // Nenkin number
  { key: 'nenkin_1', expected: '1' },
  { key: 'nenkin_10', expected: '0' },
  // DOB era
  { key: 'dob_era_jp', expected: '平成' },
  { key: 'dob_era_yr', expected: '07' },
  { key: 'dob_era_yr_1', expected: '0' },
  { key: 'dob_era_yr_2', expected: '7' },
  // Sex
  { key: 'sex_M_mark', expected: '○' },
  { key: 'sex_F_mark', expected: '' },
  // Retirement deduction (3 years)
  { key: 'retirementDeductionAmount', expected: '1200000' },
  // Departure date era
  { key: 'departureDate_era_jp', expected: '令和' },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  const actual = mapped[check.key];
  if (actual === check.expected) {
    console.log(`✅ ${check.key}: "${actual}"`);
    passed++;
  } else {
    console.log(`❌ ${check.key}: expected "${check.expected}" but got "${actual}"`);
    failed++;
  }
}

console.log(`\n=== KẾT QUẢ: ${passed} passed, ${failed} failed ===`);

// In toàn bộ mapping
console.log('\n=== FULL MAPPING OUTPUT ===');
const sorted = Object.entries(mapped).sort(([a], [b]) => a.localeCompare(b));
for (const [k, v] of sorted) {
  if (v !== '') {
    console.log(`  ${k}: "${v}"`);
  }
}

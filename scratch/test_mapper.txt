/**
 * scratch/test_mapper.ts
 * Unit test script for documentMapper.ts
 * Run: npx tsx scratch/test_mapper.ts
 *
 * Author: PE (Perplexity) — Sprint 4
 */

import { toJapaneseEra, splitChars, mapTemplate1, mapTemplate2, mapTemplate3 } from '../src/lib/documentMapper';

let pass = 0;
let fail = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    pass++;
  } else {
    console.error(`  \x1b[31m✗\x1b[0m ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
console.log('\n=== toJapaneseEra ===');

assert('Reiwa 2019-05-01',
  toJapaneseEra(new Date('2019-05-01')),
  { era: 'Reiwa', eraJp: '\u4ee4\u548c', eraYear: 1, eraYearStr: '01' });

assert('Reiwa 2026',
  toJapaneseEra(new Date('2026-07-15')),
  { era: 'Reiwa', eraJp: '\u4ee4\u548c', eraYear: 8, eraYearStr: '08' });

assert('Heisei last day 2019-04-30',
  toJapaneseEra(new Date('2019-04-30')),
  { era: 'Heisei', eraJp: '\u5e73\u6210', eraYear: 31, eraYearStr: '31' });

assert('Heisei 1989-01-08',
  toJapaneseEra(new Date('1989-01-08')),
  { era: 'Heisei', eraJp: '\u5e73\u6210', eraYear: 1, eraYearStr: '01' });

assert('Showa 1960',
  toJapaneseEra(new Date('1960-06-15')),
  { era: 'Showa', eraJp: '\u662d\u548c', eraYear: 35, eraYearStr: '35' });

assert('Heisei year 1989-01-07 (still Showa)',
  toJapaneseEra(new Date('1989-01-07')).era, 'Showa');

// ---------------------------------------------------------------------------
console.log('\n=== splitChars ===');

assert('postal code 160-0022',
  splitChars('160-0022', 'post', 7, true),
  { post_1:'1', post_2:'6', post_3:'0', post_4:'0', post_5:'0', post_6:'2', post_7:'2' });

assert('nenkin number 1234567890',
  splitChars('1234567890', 'nenkin', 10, true),
  Object.fromEntries(Array.from({length:10},(_, i)=>([`nenkin_${i+1}`, String(i+1)]))));

assert('short string pads with empty string',
  splitChars('12', 'post', 7, true),
  { post_1:'1', post_2:'2', post_3:'', post_4:'', post_5:'', post_6:'', post_7:'' });

assert('empty string returns all empty',
  splitChars('', 'post', 3, true),
  { post_1:'', post_2:'', post_3:'' });

// ---------------------------------------------------------------------------
console.log('\n=== mapTemplate1 (smoke test) ===');

const mockInput = {
  application: {
    id: 'abcdef1234567890',
    createdAt: new Date('2026-07-15'),
    departureDate: new Date('2023-06-30'),
  } as never,
  customer: {
    fullName: 'NGUYEN VAN A',
    fullNameKata: '\u30b0\u30a8\u30f3 \u30f4\u30a1\u30f3 \u30a8\u30fc',
    dateOfBirth: new Date('1990-03-15'),
    gender: 'MALE',
    phone: '090-1234-5678',
    postalCode: '1600022',
    nenkinNumber: '1234567890',
    myNumber: '123456789012',
    nationality: '\u30d9\u30c8\u30ca\u30e0',
    addressJp: '\u6771\u4eac\u90fd\u65b0\u5bbf\u533a',
    bankName: '\u307f\u305a\u307b\u9280\u884c',
    bankBranch: '\u65b0\u5bbf\u652f\u5e97',
    bankAccountType: '\u666e\u901a',
    bankAccountNumber: '1234567',
    bankAccountName: '\u30b0\u30a8\u30f3 \u30f4\u30a1\u30f3 \u30a8\u30fc',
  } as never,
  workHistories: [
    {
      companyName: '\u682a\u5f0f\u4f1a\u793eABC',
      startDate: new Date('2018-04-01'),
      endDate:   new Date('2023-03-31'),
    } as never,
  ],
  taxOffice: {
    name:    '\u65b0\u5bbf\u7a0e\u52d9\u7f72',
    address: '\u6771\u4eac\u90fd\u65b0\u5bbf\u533a...',
  } as never,
  taxRepresentative: null,
};

const result1 = mapTemplate1(mockInput);
assert('fullName tag present',       result1.fullName, 'NGUYEN VAN A');
assert('dob_y correct',              result1.dob_y, '1990');
assert('dob_era_jp Heisei',          result1.dob_era_jp, '\u5e73\u6210');
assert('dob_era_yr correct 02',      result1.dob_era_yr, '02');
assert('post_1 = 1',                 result1.post_1, '1');
assert('post_7 = 2',                 result1.post_7, '2');
assert('gender_male_check = ✓',      result1.gender_male_check, '\u2713');
assert('gender_female_check empty',  result1.gender_female_check, '');
assert('work_company_1 present',     result1.work_company_1, '\u682a\u5f0f\u4f1a\u793eABC');
assert('taxOfficeName present',      result1.taxOfficeName, '\u65b0\u5bbf\u7a0e\u52d9\u7f72');
assert('app_id is 8 chars',          result1.app_id.length, 8);

console.log('\n=== mapTemplate3 departure date ===');
const result3 = mapTemplate3(mockInput);
assert('departure_y = 2023',         result3.departure_y, '2023');
assert('departure_m = 06',           result3.departure_m, '06');
assert('departure_d = 30',           result3.departure_d, '30');
assert('departure_y_1 = 2',          result3.departure_y_1, '2');
assert('departure_m_1 = 0',          result3.departure_m_1, '0');

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(40)}`);
console.log(`Result: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

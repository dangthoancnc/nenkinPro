import { Prisma } from '@prisma/client';

export type ApplicationWithRelations = Prisma.NenkinApplicationGetPayload<{ 
  include: { 
    customer: { include: { taxOffice: true, workHistories: true } }, 
    taxRepresentative: true 
  } 
}>;

export function mapApplicationToTemplate(application: ApplicationWithRelations) {
  const result: Record<string, string> = {};

  // Hàm split string an toàn hỗ trợ cả unicode (chữ Nhật)
  const splitStr = (str: string | null | undefined, prefix: string, maxLength?: number) => {
    if (!str) return;
    // Bỏ tất cả dấu cách để đếm ký tự chính xác (tùy chọn, đối với Furigana có thể giữ lại)
    const cleanStr = str.replace(/\s+/g, '');
    const chars = Array.from(cleanStr);
    const len = maxLength || chars.length;
    for (let i = 0; i < len; i++) {
      if (i < chars.length) {
        result[`${prefix}_${i + 1}`] = chars[i];
      } else {
        result[`${prefix}_${i + 1}`] = '';
      }
    }
  };

  // Hàm split string giữ nguyên khoảng trắng (Dùng cho Furigana)
  const splitStrKeepSpace = (str: string | null | undefined, prefix: string, maxLength?: number) => {
    if (!str) return;
    const chars = Array.from(str);
    const len = Math.max(maxLength || 0, chars.length);
    for (let i = 0; i < len; i++) {
      if (i < chars.length) {
        result[`${prefix}_${i + 1}`] = chars[i];
      } else {
        result[`${prefix}_${i + 1}`] = '';
      }
    }
  };

  const getJapaneseEra = (date: Date) => {
    const ymd = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    if (ymd >= 20190501) return { name: 'Reiwa', nameJp: '令和', year: date.getFullYear() - 2018 };
    if (ymd >= 19890108) return { name: 'Heisei', nameJp: '平成', year: date.getFullYear() - 1988 };
    if (ymd >= 19261225) return { name: 'Showa', nameJp: '昭和', year: date.getFullYear() - 1925 };
    return { name: 'Unknown', nameJp: '', year: date.getFullYear() };
  };

  const mapDate = (dateVal: Date | string | null | undefined, prefix: string) => {
    if (!dateVal) return;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return;

    const yyyy = d.getFullYear().toString();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');

    result[`${prefix}_y`] = yyyy;
    result[`${prefix}_m`] = mm;
    result[`${prefix}_d`] = dd;
    result[`${prefix}_full`] = `${yyyy}/${mm}/${dd}`;

    splitStr(yyyy, `${prefix}_y`, 4);
    splitStr(mm, `${prefix}_m`, 2);
    splitStr(dd, `${prefix}_d`, 2);

    const era = getJapaneseEra(d);
    result[`${prefix}_era`] = era.name;
    result[`${prefix}_era_jp`] = era.nameJp;
    
    // VD: 令和 05 -> 05
    const eraYrStr = era.year.toString().padStart(2, '0');
    result[`${prefix}_era_yr`] = eraYrStr;
    splitStr(eraYrStr, `${prefix}_era_yr`, 2);
  };

  // ==========================================
  // CUSTOMER MAPPING
  // ==========================================
  if (application.customer) {
    const c = application.customer;
    
    // Tên
    result['fullName'] = c.fullName || '';
    result['lastName'] = c.lastName || '';
    result['firstName'] = c.firstName || '';
    result['fullNameFurigana'] = c.fullNameFurigana || '';
    splitStrKeepSpace(c.fullNameFurigana, 'fullNameFurigana');

    // Địa chỉ Nhật Bản
    result['address'] = c.zairyuAddress || '';
    splitStr(c.postalCode?.replace('-', ''), 'post', 7); // VD: 123-4567
    result['postalCodeFormat'] = c.postalCode || ''; // 123-4567

    // Địa chỉ nước ngoài (VN)
    result['overseasAddress'] = c.overseasAddress || '';
    result['overseasCountry'] = c.overseasCountry || 'VIET NAM';
    result['overseasStreet'] = c.overseasStreet || '';
    result['overseasCity'] = c.overseasCity || '';
    result['overseasProvince'] = c.overseasProvince || '';
    result['overseasPostalCode'] = c.overseasPostalCode || '';
    
    // Ngân hàng
    result['bankName'] = c.bankName || '';
    result['branchName'] = c.branchName || '';
    result['bankBranchAddress'] = c.bankBranchAddress || '';
    result['bankBranchCity'] = c.bankBranchCity || '';
    result['bankCountry'] = c.bankCountry || 'VIET NAM';
    splitStr(c.accountNumber, 'bank', 7);
    result['accountName'] = c.accountName || '';
    result['accountNameKatakana'] = c.accountNameKatakana || '';
    result['swiftCode'] = c.swiftCode || '';
    splitStr(c.swiftCode, 'swift', 11);

    // Thông tin cá nhân
    result['nationality'] = c.nationality || 'VIET NAM';
    result['sex'] = c.sex || '';
    result['sex_M_mark'] = c.sex === 'Nam' ? '○' : '';
    result['sex_F_mark'] = c.sex === 'Nữ' ? '○' : '';
    result['phone'] = c.phone || '';
    splitStr(c.phone?.replace(/[-\s]/g, ''), 'phone', 11);
    result['nenkinNumber'] = c.nenkinNumber || '';
    splitStr(c.nenkinNumber?.replace(/[-\s]/g, ''), 'nenkin', 10);
    splitStr(c.myNumber?.replace(/[-\s]/g, ''), 'my_num', 12);
    result['occupation'] = c.occupation || '';
    result['headOfHouseholdName'] = c.headOfHouseholdName || '';
    result['relationshipToHead'] = c.relationshipToHead || '納税管理人';
    
    result['hasPermanentResidence'] = c.hasPermanentResidence ? 'YES' : 'NO';
    if (c.hasPermanentResidence) {
      result['permRes_YES_mark'] = '○';
      result['permRes_NO_mark'] = '';
    } else {
      result['permRes_YES_mark'] = '';
      result['permRes_NO_mark'] = '○';
    }

    if (c.hasPermanentResidence && c.permanentResidenceDate) {
      mapDate(c.permanentResidenceDate, 'permResDate');
    }

    // Ngày tháng
    mapDate(c.dob, 'dob');
    mapDate(c.departureDate, 'departureDate');

    if (c.taxOffice) {
      result['taxOfficeName'] = c.taxOffice.name || '';
      result['taxOfficeAddress'] = c.taxOffice.address || '';
      result['taxOfficeZipCode'] = c.taxOffice.postalCode || c.taxOffice.zipCode || '';
      splitStr(result['taxOfficeZipCode'].replace(/[-\s]/g, ''), 'tax_post', 7);
    }

    // Lịch sử làm việc
    if (c.workHistories && c.workHistories.length > 0) {
      c.workHistories.forEach((wh, idx) => {
        const i = idx + 1;
        result[`workHistory_${i}_companyName`] = wh.companyName || '';
        result[`workHistory_${i}_companyAddress`] = wh.companyAddress || '';
        if (wh.startDate) mapDate(wh.startDate, `workHistory_${i}_start`);
        if (wh.endDate) mapDate(wh.endDate, `workHistory_${i}_end`);
        
        result[`workHistory_${i}_pensionType`] = wh.pensionType || '';
        
        // Loại hình bảo hiểm: 1: Quốc dân, 2: LĐXH (厚生年金保険), 3: Hàng hải, 4: Hỗ tương
        result[`workHistory_${i}_type_1_mark`] = '';
        result[`workHistory_${i}_type_2_mark`] = '';
        result[`workHistory_${i}_type_3_mark`] = '';
        result[`workHistory_${i}_type_4_mark`] = '';
        
        if (wh.pensionType === '国民年金') {
          result[`workHistory_${i}_type_1_mark`] = '○';
        } else if (wh.pensionType === '厚生年金保険') {
          result[`workHistory_${i}_type_2_mark`] = '○';
        } else if (wh.pensionType === '船員保険') {
          result[`workHistory_${i}_type_3_mark`] = '○';
        } else if (wh.pensionType === '共済組合') {
          result[`workHistory_${i}_type_4_mark`] = '○';
        }
      });
    }
  }

  // ==========================================
  // TAX REPRESENTATIVE MAPPING
  // ==========================================
  if (application.taxRepresentative) {
    const rep = application.taxRepresentative;
    result['rep_fullName'] = rep.fullName || '';
    result['rep_fullNameKana'] = rep.fullNameKana || '';
    result['rep_address'] = rep.address || '';
    result['rep_postalCodeFormat'] = rep.postalCode || ''; // 123-4567
    splitStr(rep.postalCode?.replace(/[-\s]/g, ''), 'rep_post', 7);
    result['rep_phone'] = rep.phone || '';
    splitStr(rep.phone?.replace(/[-\s]/g, ''), 'rep_phone', 11);
    result['rep_relationship'] = rep.relationship || '納税管理人';
    
    result['rep_bankName'] = rep.bankName || '';
    result['rep_branchName'] = rep.branchName || '';
    result['rep_accountNumber'] = rep.accountNumber || '';
    result['rep_accountName'] = rep.accountName || '';
  }

  // ==========================================
  // APPLICATION MAPPING & CALCULATIONS
  // ==========================================
  mapDate(application.applyDate, 'applyDate');
  mapDate(application.noticeDate, 'noticeDate');

  const taxYearStr = application.taxYear?.toString().padStart(2, '0') || '';
  result['taxYear_era_yr'] = taxYearStr;
  splitStr(taxYearStr, 'taxYear_era_yr', 2);

  // Format Decimal values as strings
  const decimalFields = [
    'totalExpectedJpy',
    'received1stJpy',
    'received2ndJpy',
    'tax2ndJpy',
    'withheldTax',
    'serviceFeeJpy',
    'exchangeRate',
    'serviceFeeVnd',
  ] as const;
  
  for (const field of decimalFields) {
    const val = application[field as keyof ApplicationWithRelations];
    if (val !== undefined && val !== null) {
      result[field] = val.toString();
    } else {
      result[field] = '';
    }
  }

  // Thuế tính tự động cho Bảng 3
  const workYears = application.workYears || 0;
  // Làm tròn lên số năm làm việc (VD: 2.1 năm = 3 năm)
  const roundedWorkYears = Math.ceil(workYears);
  
  // Công thức: 退職所得控除額 = Số năm * 400,000 JPY (Chỉ đúng với <= 20 năm)
  // Thực tế Nenkin thường < 10 năm nên luôn dùng công thức này
  const retirementDeductionAmount = roundedWorkYears * 400000;
  result['retirementDeductionAmount'] = retirementDeductionAmount.toString();
  
  result['taxableRetirementIncome'] = '0'; // (76)
  result['calculatedTax'] = '0'; // (92)
  result['refundAmount'] = result['withheldTax']; // Tiền hoàn thường bằng đúng số tiền đã khấu trừ

  return result;
}

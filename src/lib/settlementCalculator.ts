/**
 * settlementCalculator.ts
 * Tự động tính toán số liệu quyết toán và tạo mẫu văn bản thông báo cho nhân viên gửi thủ công.
 */

export interface SettlementInput {
  customerName: string;
  customerCode?: string;
  totalExpectedJpy?: number | string | null;
  received1stJpy?: number | string | null;
  withheldTax?: number | string | null;
  received2ndJpy?: number | string | null;
  exchangeRate?: number | string | null;
  serviceFeeJpy?: number | string | null;
  serviceFeeVnd?: number | string | null;
  referralBonusJpy?: number | string | null;
}

export function formatJpy(val: number | string | null | undefined): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!num || isNaN(num)) return '0 ¥';
  return `${Math.floor(num).toLocaleString('ja-JP')} ¥`;
}

export function formatVnd(val: number | string | null | undefined): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!num || isNaN(num)) return '0 ₫';
  return `${Math.floor(num).toLocaleString('vi-VN')} ₫`;
}

export function generateSettlementTemplates(input: SettlementInput) {
  const name = input.customerName || 'Khách hàng';
  const code = input.customerCode || 'N/A';

  const expected = parseFloat(String(input.totalExpectedJpy || 0));
  const r1st = parseFloat(String(input.received1stJpy || 0));
  const tax2nd = parseFloat(String(input.withheldTax || Math.floor(expected * 0.2042)));
  const r2nd = parseFloat(String(input.received2ndJpy || tax2nd));
  const rate = parseFloat(String(input.exchangeRate || 165));
  
  const feeJpy = parseFloat(String(input.serviceFeeJpy || Math.floor((r1st + r2nd) * 0.2)));
  const feeVnd = parseFloat(String(input.serviceFeeVnd || Math.floor(feeJpy * rate)));
  const bonusJpy = parseFloat(String(input.referralBonusJpy || 2000));
  const bonusVnd = Math.floor(bonusJpy * rate);

  const r1stVnd = Math.floor(r1st * rate);
  const r2ndVnd = Math.floor(r2nd * rate);
  const net2ndJpy = Math.max(0, r2nd - feeJpy);
  const net2ndVnd = Math.floor(net2ndJpy * rate);

  // Template 1: Thông báo Lần 1
  const template1st = `[VIETNENKIN] THÔNG BÁO KẾT QUẢ NENKIN LẦN 1 (80%)
--------------------------------------------
Kính gửi Quý khách: ${name} (Mã hồ sơ: ${code})

VietNenkin xin thông báo kết quả giải quyết Nenkin Lần 1 của Quý khách như sau:

1. Tổng tiền được duyệt: ${formatJpy(expected)}
2. Thuế thu nhập bị giữ lại (20.42%): ${formatJpy(tax2nd)}
3. Tiền thực nhận Lần 1 (chuyển vào tài khoản): ${formatJpy(r1st)} (~ ${formatVnd(r1stVnd)})
Tỷ giá áp dụng: 1 JPY = ${rate} VND

Số tiền 20.42% thuế bị giữ lại (${formatJpy(tax2nd)}) sẽ được VietNenkin tiếp tục làm thủ tục xin lại ở Lần 2.

Trân trọng cảm ơn Quý khách!`;

  // Template 2: Thông báo Lần 2 (Quyết toán)
  const template2nd = `[VIETNENKIN] THÔNG BÁO QUYẾT TOÁN HOÀN THUẾ LẦN 2 (20.42%)
--------------------------------------------
Kính gửi Quý khách: ${name} (Mã hồ sơ: ${code})

VietNenkin xin thông báo kết quả hoàn thuế Nenkin Lần 2 của Quý khách như sau:

1. Số tiền thuế thu hồi được Lần 2: ${formatJpy(r2nd)} (~ ${formatVnd(r2ndVnd)})
2. Phí dịch vụ quyết toán (20%): ${formatJpy(feeJpy)} (~ ${formatVnd(feeVnd)})
3. SỐ TIỀN THỰC NHẬN CÒN LẠI CỦA KHÁCH: ${formatJpy(net2ndJpy)} (~ ${formatVnd(net2ndVnd)})
Tỷ giá áp dụng: 1 JPY = ${rate} VND

Quý khách vui lòng kiểm tra tài khoản ngân hàng và xác nhận lại với VietNenkin. Cảm ơn Quý khách đã tin tưởng sử dụng dịch vụ!`;

  // Template 3: Thông báo cho CTV giới thiệu
  const templateCtv = `[VIETNENKIN] THÔNG BÁO HOA HỒNG GIỚI THIỆU KHÁCH HÀNG
--------------------------------------------
Kính gửi Anh/Chị Cộng tác viên,

VietNenkin xin thông báo hồ sơ khách hàng do Anh/Chị giới thiệu đã xử lý thành công:

- Khách hàng: ${name} (Mã hồ sơ: ${code})
- Mức thưởng giới thiệu: ${formatJpy(bonusJpy)} (~ ${formatVnd(bonusVnd)})
Tỷ giá chuyển đổi: 1 JPY = ${rate} VND

Số tiền hoa hồng đã được ghi nhận vào hệ thống quyết toán. Cảm ơn Anh/Chị đã đồng hành cùng VietNenkin!`;

  return {
    template1st,
    template2nd,
    templateCtv,
    summary: {
      expected,
      r1st,
      tax2nd,
      r2nd,
      rate,
      feeJpy,
      feeVnd,
      net2ndJpy,
      net2ndVnd,
      bonusJpy,
      bonusVnd,
    }
  };
}

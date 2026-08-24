import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const VN_BANKS = [
  { bankName: 'NGÂN HÀNG TMCP NGOẠI THƯƠNG VIỆT NAM (VIETCOMBANK)', branchName: '', swiftCode: 'BFTVVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM (BIDV)', branchName: '', swiftCode: 'BIDVVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM (VIETINBANK)', branchName: '', swiftCode: 'ICBVVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN VN (AGRIBANK)', branchName: '', swiftCode: 'VBAAVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP QUÂN ĐỘI (MBBANK)', branchName: '', swiftCode: 'MSCBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP KỸ THƯƠNG VIỆT NAM (TECHCOMBANK)', branchName: '', swiftCode: 'VTCBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP Á CHÂU (ACB)', branchName: '', swiftCode: 'ASCBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG (VPBANK)', branchName: '', swiftCode: 'VPBRVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP SÀI GÒN THƯƠNG TÍN (SACOMBANK)', branchName: '', swiftCode: 'SGTTVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP TIÊN PHONG (TPBANK)', branchName: '', swiftCode: 'TPBNVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP HÀNG HẢI VIỆT NAM (MSB)', branchName: '', swiftCode: 'MMSBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP PHÁT TRIỂN TP.HCM (HDBANK)', branchName: '', swiftCode: 'HDBCVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP PHƯƠNG ĐÔNG (OCB)', branchName: '', swiftCode: 'OCBNVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP SÀI GÒN - HÀ NỘI (SHB)', branchName: '', swiftCode: 'SHBAVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP QUỐC TẾ VIỆT NAM (VIB)', branchName: '', swiftCode: 'VNIBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP XUẤT NHẬP KHẨU VIỆT NAM (EXIMBANK)', branchName: '', swiftCode: 'EBISVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP SÀI GÒN (SCB)', branchName: '', swiftCode: 'SACLVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP BẮC Á (BAC A BANK)', branchName: '', swiftCode: 'NASBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP ĐÔNG NAM Á (SEABANK)', branchName: '', swiftCode: 'SEAVVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP BƯU ĐIỆN LIÊN VIỆT (LPBANK)', branchName: '', swiftCode: 'LPBKVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP VIỆT Á (VIETABANK)', branchName: '', swiftCode: 'VABKVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP NAM Á (NAM A BANK)', branchName: '', swiftCode: 'NAMAVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP AN BÌNH (ABBANK)', branchName: '', swiftCode: 'ABBKVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP BẢN VIỆT (BVBANK)', branchName: '', swiftCode: 'VCCBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP KIÊN LONG (KIENLONGBANK)', branchName: '', swiftCode: 'KLBKVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP ĐẠI CHÚNG VIỆT NAM (PVCOMBANK)', branchName: '', swiftCode: 'WBFSVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV SHINHAN VIỆT NAM', branchName: '', swiftCode: 'SHBKVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV STANDARD CHARTERED VIỆT NAM', branchName: '', swiftCode: 'SCBLVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV HSBC VIỆT NAM', branchName: '', swiftCode: 'HSBCVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV PUBLIC BANK VIỆT NAM', branchName: '', swiftCode: 'VIDPVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV WOORI VIỆT NAM', branchName: '', swiftCode: 'HVBCVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV HONG LEONG VIỆT NAM', branchName: '', swiftCode: 'HLBBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TNHH MTV CIMB VIỆT NAM', branchName: '', swiftCode: 'CIBBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP BẢO VIỆT (BAOVIET BANK)', branchName: '', swiftCode: 'BVBKVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG TMCP VIỆT NAM THƯƠNG TÍN (VIETBANK)', branchName: '', swiftCode: 'VNTTVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG THƯƠNG MẠI TNHH MTV DẦU KHÍ TOÀN CẦU (GPBANK)', branchName: '', swiftCode: 'GPBLVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG THƯƠNG MẠI TNHH MTV ĐẠI DƯƠNG (OCEANBANK)', branchName: '', swiftCode: 'OCEBVNVX', country: 'VIETNAM' },
  { bankName: 'NGÂN HÀNG THƯƠNG MẠI TNHH MTV XÂY DỰNG VIỆT NAM (CB)', branchName: '', swiftCode: 'GTBAVNVX', country: 'VIETNAM' },
];

const JP_BANKS = [
  { bankName: '三菱UFJ銀行 (MUFG Bank)', branchName: '', swiftCode: 'BOTKJPJT', country: 'JAPAN' },
  { bankName: '三井住友銀行 (SMBC)', branchName: '', swiftCode: 'SMBCJPJT', country: 'JAPAN' },
  { bankName: 'みずほ銀行 (Mizuho Bank)', branchName: '', swiftCode: 'MHCBJPJT', country: 'JAPAN' },
  { bankName: 'ゆうちょ銀行 (Japan Post Bank / Yucho)', branchName: '', swiftCode: 'JPPSJPJ1', country: 'JAPAN' },
  { bankName: 'りそな銀行 (Resona Bank)', branchName: '', swiftCode: 'DIWAJPJT', country: 'JAPAN' },
  { bankName: '埼玉りそな銀行 (Saitama Resona Bank)', branchName: '', swiftCode: 'SRBLJPJT', country: 'JAPAN' },
  { bankName: '横浜銀行 (Bank of Yokohama)', branchName: '', swiftCode: 'BOYKJPJT', country: 'JAPAN' },
  { bankName: '千葉銀行 (Chiba Bank)', branchName: '', swiftCode: 'CHBAJPJT', country: 'JAPAN' },
  { bankName: '福岡銀行 (Bank of Fukuoka)', branchName: '', swiftCode: 'FKBKJPJT', country: 'JAPAN' },
  { bankName: '静岡銀行 (Shizuoka Bank)', branchName: '', swiftCode: 'SHIZJPJT', country: 'JAPAN' },
  { bankName: '七十七銀行 (77 Bank)', branchName: '', swiftCode: 'BKSSJPJT', country: 'JAPAN' },
  { bankName: '京都銀行 (Bank of Kyoto)', branchName: '', swiftCode: 'BKYTJPJT', country: 'JAPAN' },
  { bankName: '八十二銀行 (Hachijuni Bank)', branchName: '', swiftCode: 'HABKJPJT', country: 'JAPAN' },
  { bankName: '広島銀行 (Hiroshima Bank)', branchName: '', swiftCode: 'HIROJPJT', country: 'JAPAN' },
  { bankName: '西日本シティ銀行 (Nishi-Nippon City Bank)', branchName: '', swiftCode: 'NISHJPJT', country: 'JAPAN' },
  { bankName: '北洋銀行 (North Pacific Bank)', branchName: '', swiftCode: 'THOKJPJT', country: 'JAPAN' },
  { bankName: '群馬銀行 (Gunma Bank)', branchName: '', swiftCode: 'GUMAJPJT', country: 'JAPAN' },
  { bankName: '常陽銀行 (Joyo Bank)', branchName: '', swiftCode: 'JOYOJPJT', country: 'JAPAN' },
  { bankName: '中国銀行 (Chugoku Bank)', branchName: '', swiftCode: 'CHUGJPJT', country: 'JAPAN' },
  { bankName: '百十四銀行 (114 Bank)', branchName: '', swiftCode: 'HYAKJPJT', country: 'JAPAN' },
  { bankName: '伊予銀行 (Iyo Bank)', branchName: '', swiftCode: 'IYOBJPJT', country: 'JAPAN' },
  { bankName: '十六銀行 (Juroku Bank)', branchName: '', swiftCode: 'JUROJPJT', country: 'JAPAN' },
  { bankName: '百五銀行 (Hyakugo Bank)', branchName: '', swiftCode: 'HYGOJPJT', country: 'JAPAN' },
  { bankName: '南都銀行 (Nanto Bank)', branchName: '', swiftCode: 'NANTJPJT', country: 'JAPAN' },
  { bankName: '楽天銀行 (Rakuten Bank)', branchName: '', swiftCode: 'EBTCJPJT', country: 'JAPAN' },
  { bankName: 'PayPay銀行 (PayPay Bank)', branchName: '', swiftCode: 'JNETJPJT', country: 'JAPAN' },
  { bankName: '住信SBIネット銀行 (SBI Sumishin Net Bank)', branchName: '', swiftCode: 'SSNBJPJT', country: 'JAPAN' },
  { bankName: 'ソニー銀行 (Sony Bank)', branchName: '', swiftCode: 'MONYJPJT', country: 'JAPAN' },
  { bankName: 'あおぞら銀行 (Aozora Bank)', branchName: '', swiftCode: 'AOZOJPJT', country: 'JAPAN' },
  { bankName: '新生銀行 (SBI Shinsei Bank)', branchName: '', swiftCode: 'LTCBJPJT', country: 'JAPAN' },
];

async function main() {
  console.log('Seeding Bank Dictionary...');
  const all = [...VN_BANKS, ...JP_BANKS];
  let count = 0;
  for (const b of all) {
    await prisma.bankDictionary.upsert({
      where: {
        country_bankName_branchName: {
          country: b.country,
          bankName: b.bankName,
          branchName: b.branchName || '',
        }
      },
      update: {
        swiftCode: b.swiftCode,
      },
      create: {
        country: b.country,
        bankName: b.bankName,
        branchName: b.branchName || '',
        swiftCode: b.swiftCode,
      }
    });
    count++;
  }
  console.log(`Successfully seeded ${count} banks into BankDictionary!`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

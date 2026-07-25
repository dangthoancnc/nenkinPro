import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// ── KHO CÂU HỎI & ĐÁP ÁN SOẠN SẴN (PRE-COMPILED KNOWLEDGE DICTIONARY) ──
// Phản hồi siêu tốc 0ms, không tốn thời gian gọi API Gemini
const PRECOMPILED_DICTIONARY: { keywords: string[]; reply: string }[] = [
  {
    keywords: ['điều kiện', 'dieu kien', 'đủ điều kiện', 'được làm nenkin', 'ai được làm'],
    reply: `📌 **ĐIỀU KIỆN ĐỂ LẤY LẠI TIỀN NENKIN NHẬT BẢN:**

1️⃣ **Không mang quốc tịch Nhật Bản** (Là lao động, thực tập sinh, kỹ sư Việt Nam).
2️⃣ **Đã đóng BHXH (Nenkin)** từ **6 tháng trở lên** tại Nhật Bản.
3️⃣ **Đã về nước** và cắt đăng ký cư trú (hoặc đã làm thủ tục xuất cảnh khỏi Nhật).
4️⃣ **Thời gian quy định**:
   • *Lần 1 (Bảo hiểm 80%)*: Chưa quá **2 năm** kể từ ngày rời Nhật Bản.
   • *Lần 2 (Hoàn thuế 20.42%)*: Chưa quá **5 năm** kể từ ngày rời Nhật Bản.`,
  },
  {
    keywords: ['bao nhiêu', 'bao nhieu', 'mức hưởng', 'tính tiền', 'nhận được bao nhiêu', '80%', '20.42%'],
    reply: `💰 **TỔNG SỐ TIỀN BẠN SẼ NHẬN ĐƯỢC:**

Hồ sơ Nenkin được chia làm 2 Giai đoạn nhận tiền:

1️⃣ **Giai đoạn 1 (Lần 1 - 80% Bảo hiểm):**
   • Nhận lại **80% tổng số tiền bảo hiểm** bạn đã đóng.
   • Cục BHXH Nhật Bản (*Japan Pension Service*) chuyển **trực tiếp vào Tài khoản Ngân hàng cá nhân** của bạn tại Việt Nam (hoặc Nhật).

2️⃣ **Giai đoạn 2 (Lần 2 - 20.42% Thuế khấu trừ):**
   • Cục Thuế giữ lại **20.42% tiền thuế thu nhập**.
   • Khoản tiền thuế này sẽ được **VietNenkin Duyên nộp đơn xin hoàn lại 100%** qua Người đại diện nộp thuế (*Tax Representative*).`,
  },
  {
    keywords: ['giấy tờ', 'giay to', 'hồ sơ', 'ho so', 'cần những gì', 'can nhung gi', 'thủ tục'],
    reply: `📑 **CÁC GIẤY TỜ CẦN CHUẨN BỊ (CHỈ CẦN CHỤP ẢNH RÕ NÉT):**

1️⃣ **Sổ Nenkin** (Bảo hiểm xã hội Nhật Bản - Bìa xanh hoặc bìa cam).
2️⃣ **Hộ chiếu** (Ảnh trang thông tin cá nhân + Con dấu ngày xuất cảnh rời Nhật).
3️⃣ **Thẻ ngoại kiều (Zairyu Card)**: Chụp rõ 2 mặt trước và sau.
4️⃣ **Tài khoản ngân hàng cá nhân tại Việt Nam**: Chấp nhận Vietcombank, BIDV, Agribank, Techcombank, Viettinbank, MBBank... (Có mã SWIFT Code).`,
  },
  {
    keywords: ['thời gian', 'thoi gian', 'bao lâu', 'bao lau', 'mất bao lâu', 'khi nào nhận được'],
    reply: `⏳ **THỜI GIAN XỬ LÝ TIẾN TRÌNH HỒ SƠ:**

• **Lần 1 (Nenkin 80%)**: Từ **3 - 5 tháng** kể từ ngày Cục BHXH Nhật Bản nhận đủ hồ sơ hợp lệ.
• **Lần 2 (Hoàn thuế 20.42%)**: Từ **1 - 2 tháng** sau khi nhận được Giấy thông báo cấp Lần 1 (*脱退一時金支給決定通知書*).

*Lưu ý: Quý khách có thể tự tra cứu tiến độ thời gian thực trên Website bằng Mã số hồ sơ + Mã PIN bảo mật!*`,
  },
  {
    keywords: ['phí', 'chi phí', 'phi dịch vụ', 'gia ca', 'bảng giá'],
    reply: `🏢 **CHÍNH SÁCH PHÍ DỊCH VỤ VIETNENKIN DUYÊN:**

• Cam kết **Phí dịch vụ minh bạch**, không phát sinh thêm chi phí ẩn.
• **Giảm ngay 2.000 JPY** khi có Mã giới thiệu từ CTV hoặc Khách hàng cũ.
• Quý khách được hỗ trợ tư vấn 1-1 và theo dõi tiến độ hồ sơ 24/7 trực tiếp trên Hệ thống Web Portal.`,
  },
  {
    keywords: ['tra cứu', 'tra cuu', 'theo dõi', 'xem tiến độ', 'mã pin'],
    reply: `📲 **HƯỚNG DẪN TRA CỨU TIẾN ĐỘ HỒ SƠ:**

1️⃣ Bấm vào phần **"Theo dõi hồ sơ"** trên trang chủ VietNenkin Duyên.
2️⃣ Nhập **Mã số hồ sơ / Mã tra cứu** (Ví dụ: \`KH001\` hoặc Mã thẻ ngoại kiều).
3️⃣ Nhập **Mã PIN bảo mật** đã được cấp (Mặc định: \`123456\`).
4️⃣ Bấm **Đăng nhập tra cứu** để xem chi tiết tiền thực nhận Lần 1, tiền thuế Lần 2 & trạng thái xử lý!`,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp nội dung câu hỏi.' }, { status: 400 });
    }

    const cleanMsg = message.toLowerCase().trim();

    // ── BƯỚC 1: KIỂM TRA KHO CÂU HỎI SOẠN SẴN (PRE-COMPILED MATCH) ──
    // Trả lời siêu tốc 0ms không gọi Gemini
    for (const item of PRECOMPILED_DICTIONARY) {
      if (item.keywords.some(kw => cleanMsg.includes(kw))) {
        return NextResponse.json({
          success: true,
          reply: item.reply,
          isPrecompiled: true,
        });
      }
    }

    // ── BƯỚC 2: NẾU LÀ CÂU HỎI PHỨC TẠP KHÔNG CÓ TRONG KHO SOẠN SẴN -> MỚI GỌI GEMINI 2.5 FLASH ──
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        reply: generateFallbackReply(cleanMsg),
        isPrecompiled: true,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `Bạn là Trợ lý AI VietNenkin Duyên. Nhiệm vụ của bạn là tư vấn ngắn gọn, chính xác (100-200 từ) về thủ tục lấy tiền Nenkin Nhật Bản (Lần 1 80% & Lần 2 Thuế 20.42%). Nếu câu hỏi phức tạp, hãy khuyên khách bấm nút "Gặp trực tiếp Tư vấn viên".`;

    const result = await model.generateContent(`${systemPrompt}\n\nCâu hỏi khách hàng: ${message}`);
    const response = await result.response;
    const replyText = response.text() || generateFallbackReply(cleanMsg);

    return NextResponse.json({
      success: true,
      reply: replyText,
      isPrecompiled: false,
    });

  } catch (err: any) {
    console.error('Public AI chat error:', err);
    return NextResponse.json({
      success: true,
      reply: generateFallbackReply(request.headers.get('x-user-message') || ''),
      isPrecompiled: true,
    });
  }
}

function generateFallbackReply(msg: string): string {
  return `Dạ quý khách có thể chọn các nút câu hỏi soạn sẵn bên dưới để xem phản hồi tức thì, hoặc bấm **"Gặp trực tiếp Tư vấn viên"** để được chuyên viên VietNenkin Duyên hỗ trợ trực tiếp ạ!`;
}

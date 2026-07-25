import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp nội dung câu hỏi.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Default fallback responses if API key is not configured or fails
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        reply: generateFallbackReply(message),
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Strictly use gemini-2.5-flash per project rules
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `Bạn là Chuyên viên Trợ lý AI của VietNenkin Duyên - Dịch vụ Hoàn thuế & BH Nenkin Nhật Bản uy tín.
Nhiệm vụ của bạn là tư vấn cho Thực tập sinh, Lao động Việt Nam tại Nhật Bản về thủ tục lấy lại tiền Nenkin (Lần 1 80% & Lần 2 Thuế 20.42%).

QUY TẮC PHẢN HỒI:
1. Trả lời thân thiện, lịch sự, ngắn gọn (100-250 từ), chia ý rõ ràng.
2. Thông tin chính xác theo pháp luật Nhật Bản:
   - Lần 1: Nhận lại 80% tiền Nenkin do Cục BHXH Nhật Bản (Japan Pension Service) chi trả về tài khoản cá nhân.
   - Lần 2: Nhận lại 20.42% tiền Thuế khấu trừ (源泉徴収税) do Cục thuế địa phương hoàn lại qua Người đại diện nộp thuế (Tax Representative).
   - Thời gian làm: Lần 1 từ 3-6 tháng, Lần 2 từ 1-2 tháng.
   - Giấy tờ gồm: Sổ Nenkin, Hộ chiếu (trang có ảnh + con dấu xuất cảnh), Thẻ ngoại kiều 2 mặt, Số tài khoản ngân hàng Việt Nam/Nhật.
3. Nếu khách muốn gặp tư vấn viên trực tiếp, hãy hướng dẫn khách bấm nút "Gặp trực tiếp Tư vấn viên" ở khung chat.`;

    const result = await model.generateContent(`${systemPrompt}\n\nCâu hỏi của khách hàng: ${message}`);
    const response = await result.response;
    const replyText = response.text() || generateFallbackReply(message);

    return NextResponse.json({
      success: true,
      reply: replyText,
    });

  } catch (err: any) {
    console.error('Public AI chat error:', err);
    return NextResponse.json({
      success: true,
      reply: generateFallbackReply(request.headers.get('x-user-message') || ''),
    });
  }
}

function generateFallbackReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('điều kiện') || lower.includes('đủ điều kiện')) {
    return '📌 **Điều kiện lấy lại tiền Nenkin Nhật Bản:**\n1. Không mang quốc tịch Nhật Bản.\n2. Đã đóng tiền Bảo hiểm xã hội (Nenkin) từ 6 tháng trở lên.\n3. Đã rời khỏi Nhật Bản và không còn địa chỉ cư trú tại Nhật.\n4. Chưa quá 2 năm kể từ ngày rời Nhật (đối với Lần 1) & 5 năm (đối với Lần 2).';
  }
  if (lower.includes('bao nhiêu') || lower.includes('tiền') || lower.includes('thuế')) {
    return '💰 **Số tiền bạn nhận được gồm 2 phần:**\n- **Giai đoạn 1 (Lần 1 - 80%):** Cục BHXH Nhật Bản chuyển trực tiếp về tài khoản ngân hàng cá nhân của bạn tại Việt Nam hoặc Nhật.\n- **Giai đoạn 2 (Lần 2 - 20.42% Thuế):** Khoản tiền thuế bị giữ lại sẽ được nộp đơn xin hoàn trả từ Cục Thuế Nhật Bản qua Người đại diện nộp thuế VietNenkin Duyên.';
  }
  if (lower.includes('giấy tờ') || lower.includes('thủ tục') || lower.includes('hồ sơ')) {
    return '📑 **Giấy tờ cần chuẩn bị để làm hồ sơ:**\n1. Sổ Nenkin (Bảo hiểm xã hội Nhật Bản).\n2. Hộ chiếu (Ảnh trang cá nhân + Con dấu ngày xuất cảnh rời Nhật).\n3. Ảnh chụp Thẻ ngoại kiều 2 mặt.\n4. Số tài khoản ngân hàng cá nhân tại Việt Nam (có Swift Code) hoặc tài khoản Nhật Bản.';
  }
  if (lower.includes('thời gian') || lower.includes('bao lâu')) {
    return '⏳ **Thời gian xử lý:**\n- **Lần 1 (Bảo hiểm 80%):** Khoảng 3 - 5 tháng kể từ khi hồ sơ gửi sang Cục BHXH Nhật Bản.\n- **Lần 2 (Hoàn thuế 20.42%):** Khoảng 1 - 2 tháng sau khi nhận được Giấy thông báo Lần 1.';
  }
  return 'Dạ chào bạn! VietNenkin Duyên rất hân hạnh được hỗ trợ bạn thủ tục lấy lại 100% tiền Nenkin & Hoàn thuế Lần 2 (20.42%). Bạn có thể chọn các câu hỏi gợi ý bên dưới hoặc bấm **"Gặp trực tiếp Tư vấn viên"** để được chuyên viên hỗ trợ 1-1 ngay nhé!';
}

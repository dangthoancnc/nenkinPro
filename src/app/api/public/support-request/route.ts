import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contact, message } = body;

    if (!name || !contact) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp Họ tên và Số điện thoại / Zalo liên hệ.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanContact = contact.trim();
    const userMsg = message ? message.trim() : `Khách hàng [${cleanName}] (SĐT/Zalo: ${cleanContact}) yêu cầu gặp Tư vấn viên trực tiếp từ Website.`;

    let conversation: any = null;

    // Safely check if Prisma model exists
    if ((prisma as any).conversation) {
      conversation = await (prisma as any).conversation.create({
        data: {
          title: `💬 Yêu cầu tư vấn: ${cleanName}`,
          type: 'CUSTOMER_SUPPORT',
          messages: {
            create: {
              content: userMsg,
            },
          },
        },
      });

      // Create notification for staff/admin
      if ((prisma as any).notification) {
        const staffList = await prisma.user.findMany({ select: { id: true } });
        for (const staff of staffList) {
          await (prisma as any).notification.create({
            data: {
              userId: staff.id,
              title: `💬 Yêu cầu tư vấn mới từ Website`,
              content: `Khách hàng ${cleanName} (${cleanContact}) vừa gửi yêu cầu hỗ trợ trực tiếp.`,
              type: 'CHAT_MESSAGE',
              link: '/messenger',
            },
          });
        }
      }
    } else {
      // Fallback via Raw SQL
      const convId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.nenkin_conversations (id, title, type, "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        convId, `💬 Yêu cầu tư vấn: ${cleanName}`, 'CUSTOMER_SUPPORT'
      );
      const msgId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.nenkin_messages (id, "conversationId", content) VALUES ($1, $2, $3)`,
        msgId, convId, userMsg
      );
      conversation = { id: convId, title: `💬 Yêu cầu tư vấn: ${cleanName}` };
    }

    return NextResponse.json({
      success: true,
      message: 'Đã kết nối yêu cầu hỗ trợ thành công! Chuyên viên sẽ liên hệ lại quý khách ngay.',
      data: conversation,
    });
  } catch (err: any) {
    console.error('Public support request error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

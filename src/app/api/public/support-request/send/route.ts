import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp nội dung tin nhắn' }, { status: 400 });
    }

    const cleanContent = content.trim();
    let messageObj: any = null;

    if ((prisma as any).message) {
      messageObj = await (prisma as any).message.create({
        data: {
          conversationId,
          content: cleanContent,
        },
      });

      // Update conversation timestamp
      await (prisma as any).conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } else {
      const msgId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.nenkin_messages (id, "conversationId", content) VALUES ($1, $2, $3)`,
        msgId, conversationId, cleanContent
      );
      await prisma.$executeRawUnsafe(
        `UPDATE public.nenkin_conversations SET "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
        conversationId
      );
      messageObj = { id: msgId, conversationId, content: cleanContent };
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi tin nhắn',
      data: messageObj,
    });
  } catch (err: any) {
    console.error('Send public support message error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

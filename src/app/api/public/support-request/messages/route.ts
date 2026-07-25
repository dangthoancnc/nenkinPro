import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã cuộc hội thoại' }, { status: 400 });
    }

    let messages: any[] = [];

    if ((prisma as any).message) {
      messages = await (prisma as any).message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          senderUser: { select: { id: true, name: true, role: true } },
          senderCustomer: { select: { id: true, fullName: true } },
        },
      });
    } else {
      messages = await prisma.$queryRawUnsafe<any[]>(
        `SELECT m.*, u.name as "senderUserName"
         FROM public.nenkin_messages m
         LEFT JOIN public.nenkin_users u ON m."senderUserId" = u.id
         WHERE m."conversationId" = $1
         ORDER BY m."createdAt" ASC`,
        conversationId
      );
    }

    const formatted = messages.map(m => {
      const isStaff = Boolean(m.senderUserId || m.senderUser || m.senderUserName);
      const senderName = m.senderUser?.name || m.senderUserName || (isStaff ? 'Chuyên viên Tư vấn' : 'Bạn');

      return {
        id: m.id,
        sender: isStaff ? 'staff' : 'user',
        senderName,
        text: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    console.error('Fetch public support messages error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

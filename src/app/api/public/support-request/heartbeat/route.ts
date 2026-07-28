import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, status } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã cuộc hội thoại' }, { status: 400 });
    }

    const isClosed = status === 'closed';

    if ((prisma as any).conversation) {
      await (prisma as any).conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          // BUG #2 FIX: When customer closes browser tab, properly mark conversation
          // as RESOLVED. Previously used { title: undefined } which is a no-op in Prisma.
          ...(isClosed ? { supportStatus: 'RESOLVED' } : {}),
        },
      });
    } else {
      if (isClosed) {
        await prisma.$executeRawUnsafe(
          `UPDATE public.nenkin_conversations SET "updatedAt" = CURRENT_TIMESTAMP, "supportStatus" = 'RESOLVED' WHERE id = $1`,
          conversationId
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE public.nenkin_conversations SET "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
          conversationId
        );
      }
    }

    return NextResponse.json({ success: true, isClosed });
  } catch (err: any) {
    console.error('Support request heartbeat error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

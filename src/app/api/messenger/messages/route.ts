import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        senderUser: { select: { id: true, name: true } },
        senderCustomer: { select: { id: true, fullName: true } },
      },
    });

    const formatted = messages.map(m => {
      const senderName = m.senderUser?.name || m.senderCustomer?.fullName || 'Hệ thống';
      const isMe = m.senderUserId === user.id;

      return {
        id: m.id,
        senderName,
        isMe,
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('Fetch messages error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ success: false, error: 'conversationId and content are required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderUserId: user.id,
        content,
      },
      include: {
        senderUser: { select: { id: true, name: true } },
      },
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        senderName: message.senderUser?.name || user.name || 'Tôi',
        isMe: true,
        content: message.content,
        time: new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        createdAt: message.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Create message error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    if (!(prisma as any).notification) {
      return NextResponse.json({ success: true, data: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    return NextResponse.json({ success: true, data: [], unreadCount: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { userId, customerId, title, content, type, link } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content required' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId || user.id,
        customerId,
        title,
        content,
        type: type || 'SYSTEM',
        link,
      },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (err: any) {
    console.error('Create notification error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

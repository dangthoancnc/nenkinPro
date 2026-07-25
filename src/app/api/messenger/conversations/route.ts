import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    if (!(prisma as any).conversation) {
      return NextResponse.json({ success: true, data: [] });
    }

    let conversations = await (prisma as any).conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true, staffCode: true } },
            customer: { select: { id: true, fullName: true, code: true, phone: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // If database has 0 conversations, auto-seed from real DB customers & staff
    if (conversations.length === 0) {
      const customers = await prisma.customer.findMany({ take: 10 });
      for (const cust of customers) {
        await prisma.conversation.create({
          data: {
            title: cust.fullName,
            type: 'CUSTOMER',
            applicationId: null,
            participants: {
              create: [
                { userId: user.id },
                { customerId: cust.id },
              ],
            },
            messages: {
              create: {
                senderCustomerId: cust.id,
                content: `Xin chào! Tôi là ${cust.fullName}, hồ sơ mã #${cust.code} đã được khởi tạo trên hệ thống.`,
              },
            },
          },
        });
      }

      // Create a default general group
      await prisma.conversation.create({
        data: {
          title: '👥 Nhóm Quyết Toán & Hỗ Trợ Chung',
          type: 'GROUP',
          participants: {
            create: [{ userId: user.id }],
          },
          messages: {
            create: {
              senderUserId: user.id,
              content: 'Chào mừng các Nhân viên & CTV đến với Kênh trao đổi chung VietNenkin!',
            },
          },
        },
      });

      // Refetch after seeding
      conversations = await prisma.conversation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, role: true, staffCode: true } },
              customer: { select: { id: true, fullName: true, code: true, phone: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    const now = Date.now();
    const formatted = conversations.map((c: any) => {
      const lastMsg = c.messages?.[0]?.content || 'Chưa có tin nhắn';
      const custParticipant = c.participants?.find((p: any) => p.customer)?.customer;
      const userParticipant = c.participants?.find((p: any) => p.user && p.user.id !== user.id)?.user;

      const diffSec = c.updatedAt ? Math.floor((now - new Date(c.updatedAt).getTime()) / 1000) : 999;
      const isOnline = diffSec < 25; // Active heartbeat within last 25 seconds

      return {
        id: c.id,
        name: c.title || custParticipant?.fullName || userParticipant?.name || 'Cuộc trò chuyện',
        type: c.type,
        code: custParticipant?.code || userParticipant?.staffCode || '',
        phone: custParticipant?.phone || '',
        lastMessage: lastMsg,
        updatedAt: c.updatedAt,
        isOnline,
        lastActiveText: isOnline ? 'Trực tuyến' : `Hoạt động ${diffSec < 60 ? `${diffSec}s trước` : `${Math.floor(diffSec / 60)} phút trước`}`,
        membersCount: c.participants?.length || 0,
        members: c.participants?.map((p: any) => p.user?.name || p.customer?.fullName).filter(Boolean) || [],
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('Fetch conversations error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { title, type, userIds, customerIds } = body;

    if (!title && (!userIds || userIds.length === 0)) {
      return NextResponse.json({ success: false, error: 'Tiêu đề hoặc thành viên là bắt buộc' }, { status: 400 });
    }

    const participantsData = [
      { userId: user.id },
      ...(userIds || []).map((uid: string) => ({ userId: uid })),
      ...(customerIds || []).map((cid: string) => ({ customerId: cid })),
    ];

    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'Nhóm Chat Mới',
        type: type || 'GROUP',
        participants: {
          create: participantsData,
        },
        messages: {
          create: {
            senderUserId: user.id,
            content: `Đã tạo nhóm chat "${title || 'Nhóm Chat Mới'}"`,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json({ success: true, data: conversation });
  } catch (err: any) {
    console.error('Create conversation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

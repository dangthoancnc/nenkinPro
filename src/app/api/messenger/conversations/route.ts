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
      const isSupportConv = c.type === 'CUSTOMER_SUPPORT';
      const isResolved = c.supportStatus === 'RESOLVED';
      const isOnline = isSupportConv ? (diffSec < 25 && !isResolved) : (diffSec < 25);

      let lastActiveText = 'Trực tuyến';
      if (isSupportConv && isResolved) {
        lastActiveText = '⚪ Khách đã ngắt kết nối / Kết thúc phiên';
      } else if (isOnline) {
        lastActiveText = '🟢 Trực tuyến';
      } else {
        lastActiveText = isSupportConv
          ? `🟡 Khách vắng mặt (${diffSec < 60 ? `${diffSec}s trước` : `${Math.floor(diffSec / 60)}p trước`})`
          : `Hoạt động ${diffSec < 60 ? `${diffSec}s trước` : `${Math.floor(diffSec / 60)} phút trước`}`;
      }

      return {
        id: c.id,
        name: c.title || custParticipant?.fullName || userParticipant?.name || 'Cuộc trò chuyện',
        type: c.type,
        code: custParticipant?.code || userParticipant?.staffCode || '',
        phone: custParticipant?.phone || '',
        lastMessage: lastMsg,
        updatedAt: c.updatedAt,
        isArchived: Boolean(c.isArchived),
        assignedUserId: c.assignedUserId || null,
        assignedUserName: c.assignedUserName || null,
        supportStatus: isSupportConv ? (c.supportStatus || 'UNASSIGNED') : 'ASSIGNED',
        isOnline,
        lastActiveText,
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

    const conversation = await (prisma.conversation as any).create({
      data: {
        title: title || 'Nhóm Chat Mới',
        type: type || 'GROUP',
        supportStatus: 'ASSIGNED',
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

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { conversationId, isArchived } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    if ((prisma as any).conversation) {
      await (prisma as any).conversation.update({
        where: { id: conversationId },
        data: { isArchived: Boolean(isArchived) },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE public.nenkin_conversations SET "isArchived" = $1 WHERE id = $2`,
        Boolean(isArchived), conversationId
      );
    }

    return NextResponse.json({ success: true, isArchived: Boolean(isArchived) });
  } catch (err: any) {
    console.error('Update conversation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    if ((prisma as any).conversation) {
      await (prisma as any).conversation.delete({
        where: { id: conversationId },
      });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM public.nenkin_conversations WHERE id = $1`, conversationId);
    }

    return NextResponse.json({ success: true, message: 'Đã xóa cuộc trò chuyện' });
  } catch (err: any) {
    console.error('Delete conversation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

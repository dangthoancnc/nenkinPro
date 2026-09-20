import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { calculatePresence, extractLatestActivity } from '@/lib/messenger/presence';

export const dynamic = 'force-dynamic';

const participantSelect = {
  user: {
    select: {
      id: true,
      name: true,
      role: true,
      staffCode: true,
      sessions: {
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastSeenAt: 'desc' as const },
        take: 1,
        select: { lastSeenAt: true },
      },
      sentMessages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { createdAt: true },
      },
    },
  },
  customer: {
    select: {
      id: true,
      fullName: true,
      code: true,
      phone: true,
      applications: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        select: { id: true, status: true },
      },
      sessions: {
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastSeenAt: 'desc' as const },
        take: 1,
        select: { lastSeenAt: true },
      },
      sentMessages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { createdAt: true },
      },
    },
  },
};

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
          include: participantSelect,
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
            include: participantSelect,
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

      let isOnline = false;
      let lastActiveText = 'Ngoại tuyến';

      if (c.type === 'CUSTOMER_SUPPORT') {
        // Guest customer support via FloatingAiChat heartbeat
        const diffSec = c.updatedAt ? Math.floor((now - new Date(c.updatedAt).getTime()) / 1000) : 999;
        const isResolved = c.supportStatus === 'RESOLVED';
        isOnline = diffSec < 25 && !isResolved;

        if (isResolved) {
          lastActiveText = '⚪ Khách đã ngắt kết nối / Kết thúc phiên';
        } else if (isOnline) {
          lastActiveText = '🟢 Trực tuyến';
        } else {
          const minutes = Math.floor(diffSec / 60);
          const hours = Math.floor(diffSec / 3600);
          lastActiveText = diffSec < 60
            ? `🟡 Khách vắng mặt (${diffSec}s trước)`
            : diffSec < 3600
            ? `🟡 Khách vắng mặt (${minutes}p trước)`
            : `🟡 Khách vắng mặt (${hours}h trước)`;
        }
      } else if (c.type === 'GROUP') {
        // Group conversation: calculate how many OTHER members are online
        const otherMembers = c.participants?.filter((p: any) => !(p.userId && p.userId === user.id)) || [];
        const onlineCount = otherMembers.filter((p: any) => {
          const target = p.user || p.customer;
          const latest = extractLatestActivity(target);
          return calculatePresence(false, latest, now).isOnline;
        }).length;

        isOnline = onlineCount > 0;
        const totalCount = c.participants?.length || 0;
        lastActiveText = onlineCount > 0
          ? `${totalCount} thành viên (${onlineCount} trực tuyến)`
          : `${totalCount} thành viên`;
      } else {
        // 1-on-1 Direct / CTV / Customer Chat: presence is strictly the COUNTERPART's presence
        const counterpart = custParticipant || userParticipant;
        if (counterpart) {
          const latest = extractLatestActivity(counterpart);
          const pres = calculatePresence(false, latest, now);
          isOnline = pres.isOnline;
          lastActiveText = pres.lastActiveText;
        }
      }

      return {
        id: c.id,
        customerId: custParticipant?.id || null,
        applicationId: c.applicationId || custParticipant?.applications?.[0]?.id || null,
        name: c.title || custParticipant?.fullName || userParticipant?.name || 'Cuộc trò chuyện',
        type: c.type,
        code: custParticipant?.code || userParticipant?.staffCode || '',
        phone: custParticipant?.phone || '',
        role: userParticipant?.role ? (userParticipant.role === 'ADMIN' ? 'Quản trị viên' : userParticipant.role === 'MANAGER' ? 'Quản lý' : userParticipant.role === 'COLLABORATOR' ? 'Cộng tác viên (CTV)' : 'Nhân viên') : undefined,
        lastMessage: lastMsg,
        updatedAt: c.updatedAt,
        isArchived: Boolean(c.isArchived),
        assignedUserId: c.assignedUserId || null,
        assignedUserName: c.assignedUserName || null,
        supportStatus: c.type === 'CUSTOMER_SUPPORT' ? (c.supportStatus || 'UNASSIGNED') : 'ASSIGNED',
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

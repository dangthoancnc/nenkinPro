import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { calculatePresence, extractLatestActivity } from '@/lib/messenger/presence';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { targetUserId, targetCustomerId } = body;

    if (!targetUserId && !targetCustomerId) {
      return NextResponse.json({ success: false, error: 'targetUserId hoặc targetCustomerId là bắt buộc' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ success: false, error: 'Không thể tự tạo cuộc trò chuyện 1-1 với chính mình' }, { status: 400 });
    }

    const now = Date.now();

    // Fetch target user or customer with their sessions and messages to determine REAL presence
    let targetName = 'Đồng nghiệp';
    let targetCode = '';
    let targetPhone = '';
    let targetApplicationId: string | null = null;
    let convType = 'DIRECT';
    let targetPresence = { isOnline: false, lastActiveText: 'Ngoại tuyến' };

    if (targetUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          role: true,
          staffCode: true,
          sessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { lastSeenAt: 'desc' },
            take: 1,
            select: { lastSeenAt: true },
          },
          sentMessages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      });
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy nhân viên' }, { status: 404 });
      }
      targetName = targetUser.name;
      targetCode = targetUser.staffCode || '';
      convType = targetUser.role === 'COLLABORATOR' ? 'CTV' : 'DIRECT';
      const latest = extractLatestActivity(targetUser);
      targetPresence = calculatePresence(false, latest, now);
    } else if (targetCustomerId) {
      const targetCust = await prisma.customer.findUnique({
        where: { id: targetCustomerId },
        select: {
          id: true,
          fullName: true,
          code: true,
          phone: true,
          applications: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true },
          },
          sessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { lastSeenAt: 'desc' },
            take: 1,
            select: { lastSeenAt: true },
          },
          sentMessages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      });
      if (!targetCust) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
      }
      targetName = targetCust.fullName;
      targetCode = targetCust.code;
      targetPhone = targetCust.phone || '';
      targetApplicationId = targetCust.applications?.[0]?.id || null;
      convType = 'CUSTOMER';
      const latest = extractLatestActivity(targetCust);
      targetPresence = calculatePresence(false, latest, now);
    }

    // 1. Search for existing 1-on-1 DIRECT conversation between user and target
    const existingConversations = await (prisma.conversation as any).findMany({
      where: {
        type: targetUserId ? { in: ['DIRECT', 'CTV'] } : { in: ['CUSTOMER', 'CUSTOMER_SUPPORT', 'DIRECT'] },
        AND: [
          {
            participants: {
              some: { userId: user.id },
            },
          },
          {
            participants: {
              some: targetUserId ? { userId: targetUserId } : { customerId: targetCustomerId },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true, staffCode: true } },
            customer: {
              select: {
                id: true,
                fullName: true,
                code: true,
                phone: true,
                applications: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: { id: true },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter to find conversation with exactly 2 participants (pure 1-1)
    const exactDirect = existingConversations.find(
      (c: any) => c.participants && c.participants.length === 2
    ) || existingConversations[0];

    if (exactDirect) {
      const custParticipant = exactDirect.participants?.find((p: any) => p.customer)?.customer;
      const userParticipant = exactDirect.participants?.find((p: any) => p.user && p.user.id !== user.id)?.user;
      const staffRole = userParticipant?.role
        ? (userParticipant.role === 'ADMIN' ? 'Quản trị viên' : userParticipant.role === 'MANAGER' ? 'Quản lý' : 'Cộng tác viên (CTV)')
        : (targetUserId ? 'Nhân viên' : undefined);

      return NextResponse.json({
        success: true,
        data: {
          id: exactDirect.id,
          customerId: custParticipant?.id || null,
          applicationId: exactDirect.applicationId || custParticipant?.applications?.[0]?.id || targetApplicationId || null,
          name: exactDirect.title || custParticipant?.fullName || userParticipant?.name || 'Cuộc trò chuyện',
          type: exactDirect.type,
          code: custParticipant?.code || userParticipant?.staffCode || targetCode,
          phone: custParticipant?.phone || targetPhone,
          role: staffRole,
          lastMessage: exactDirect.messages?.[0]?.content || 'Chưa có tin nhắn',
          updatedAt: exactDirect.updatedAt,
          isArchived: Boolean(exactDirect.isArchived),
          isOnline: targetPresence.isOnline,
          lastActiveText: targetPresence.lastActiveText,
        },
      });
    }

    // 2. Not found -> Create a new DIRECT 1-on-1 conversation
    const participantsCreate = [
      { userId: user.id },
      targetUserId ? { userId: targetUserId } : { customerId: targetCustomerId },
    ];

    const newConv = await (prisma.conversation as any).create({
      data: {
        title: targetName,
        type: convType,
        supportStatus: 'ASSIGNED',
        assignedUserId: user.id,
        assignedUserName: user.name,
        participants: {
          create: participantsCreate,
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true, staffCode: true } },
            customer: {
              select: {
                id: true,
                fullName: true,
                code: true,
                phone: true,
                applications: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: { id: true },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const newTargetUser = newConv.participants?.find((p: any) => p.user && p.user.id !== user.id)?.user;
    const newStaffRole = newTargetUser?.role
      ? (newTargetUser.role === 'ADMIN' ? 'Quản trị viên' : newTargetUser.role === 'MANAGER' ? 'Quản lý' : 'Cộng tác viên (CTV)')
      : (targetUserId ? 'Nhân viên' : undefined);

    const newCustParticipant = newConv.participants?.find((p: any) => p.customer)?.customer;

    return NextResponse.json({
      success: true,
      data: {
        id: newConv.id,
        customerId: targetCustomerId || null,
        applicationId: newConv.applicationId || newCustParticipant?.applications?.[0]?.id || targetApplicationId || null,
        name: targetName,
        type: newConv.type,
        code: targetCode,
        phone: targetPhone,
        role: newStaffRole,
        lastMessage: newConv.messages?.[0]?.content || '',
        updatedAt: newConv.updatedAt,
        isArchived: false,
        isOnline: targetPresence.isOnline,
        lastActiveText: targetPresence.lastActiveText,
      },
    });
  } catch (err: any) {
    console.error('Create direct chat error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi khởi tạo chat trực tiếp' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { conversationId, userIds, customerIds } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId là bắt buộc' }, { status: 400 });
    }

    const conv = await (prisma.conversation as any).findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
            customer: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!conv) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cuộc trò chuyện' }, { status: 404 });
    }

    const existingUserIds = new Set(conv.participants.map((p: any) => p.userId).filter(Boolean));
    const existingCustomerIds = new Set(conv.participants.map((p: any) => p.customerId).filter(Boolean));

    const toAddUserIds = (userIds || []).filter((uid: string) => !existingUserIds.has(uid));
    const toAddCustomerIds = (customerIds || []).filter((cid: string) => !existingCustomerIds.has(cid));

    if (toAddUserIds.length === 0 && toAddCustomerIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Tất cả các thành viên được chọn đã có mặt trong cuộc trò chuyện' }, { status: 400 });
    }

    // Get names of added members
    const addedNames: string[] = [];

    if (toAddUserIds.length > 0) {
      const addedUsers = await prisma.user.findMany({
        where: { id: { in: toAddUserIds } },
        select: { id: true, name: true },
      });
      for (const u of addedUsers) {
        await (prisma.conversationParticipant as any).create({
          data: {
            conversationId,
            userId: u.id,
          },
        });
        addedNames.push(u.name);
      }
    }

    if (toAddCustomerIds.length > 0) {
      const addedCusts = await prisma.customer.findMany({
        where: { id: { in: toAddCustomerIds } },
        select: { id: true, fullName: true },
      });
      for (const c of addedCusts) {
        await (prisma.conversationParticipant as any).create({
          data: {
            conversationId,
            customerId: c.id,
          },
        });
        addedNames.push(c.fullName);
      }
    }

    // If conversation was DIRECT, upgrade to GROUP
    const totalCount = conv.participants.length + toAddUserIds.length + toAddCustomerIds.length;
    const shouldUpgradeToGroup = conv.type === 'DIRECT' || totalCount > 2;

    const updateData: any = {
      updatedAt: new Date(),
    };
    if (shouldUpgradeToGroup && conv.type !== 'GROUP') {
      updateData.type = 'GROUP';
      updateData.title = conv.title?.includes('Nhóm') ? conv.title : `Nhóm ${conv.title || 'Trao đổi'}`;
    }

    await (prisma.conversation as any).update({
      where: { id: conversationId },
      data: updateData,
    });

    // Create system notification message
    const systemContent = `🔄 ${user.name} đã thêm ${addedNames.join(', ')} vào cuộc trò chuyện.`;
    const sysMessage = await (prisma.message as any).create({
      data: {
        conversationId,
        senderUserId: user.id,
        content: systemContent,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã thêm ${addedNames.length} thành viên vào cuộc trò chuyện`,
      addedNames,
      sysMessage: {
        id: sysMessage.id,
        senderName: 'SYSTEM',
        isMe: false,
        content: sysMessage.content,
        time: new Date(sysMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        createdAt: sysMessage.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Add members error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi thêm thành viên' }, { status: 500 });
  }
}

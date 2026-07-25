import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { conversationId, action, targetUserId, targetUserName } = body;

    if (!conversationId || !action) {
      return NextResponse.json({ success: false, error: 'conversationId and action required' }, { status: 400 });
    }

    // Fetch current conversation
    let conv: any = null;
    if ((prisma as any).conversation) {
      conv = await (prisma as any).conversation.findUnique({
        where: { id: conversationId },
      });
    } else {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, "assignedUserId", "assignedUserName", "supportStatus" FROM public.nenkin_conversations WHERE id = $1`,
        conversationId
      );
      conv = rows[0];
    }

    if (!conv) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy cuộc trò chuyện' }, { status: 404 });
    }

    let updatedAssignedUserId = conv.assignedUserId;
    let updatedAssignedUserName = conv.assignedUserName;
    let updatedSupportStatus = conv.supportStatus || 'UNASSIGNED';
    let systemMsg = '';

    if (action === 'claim') {
      if (conv.assignedUserId && conv.assignedUserId !== user.id) {
        return NextResponse.json({
          success: false,
          error: `Chuyên viên ${conv.assignedUserName || 'khác'} đã nhanh tay tiếp nhận cuộc trò chuyện này trước đó!`,
        }, { status: 409 });
      }
      updatedAssignedUserId = user.id;
      updatedAssignedUserName = user.name;
      updatedSupportStatus = 'ASSIGNED';
      systemMsg = `⚡ Chuyên viên ${user.name} đã tiếp nhận phụ trách cuộc trò chuyện.`;
    } else if (action === 'release') {
      updatedAssignedUserId = null;
      updatedAssignedUserName = null;
      updatedSupportStatus = 'UNASSIGNED';
      systemMsg = `🔓 Cuộc trò chuyện đã được trả lại Hàng Đợi Hỗ Trợ.`;
    } else if (action === 'reassign') {
      if (!targetUserId || !targetUserName) {
        return NextResponse.json({ success: false, error: 'targetUserId & targetUserName required' }, { status: 400 });
      }
      updatedAssignedUserId = targetUserId;
      updatedAssignedUserName = targetUserName;
      updatedSupportStatus = 'ASSIGNED';
      systemMsg = `🔄 Cuộc trò chuyện đã được chuyển giao cho chuyên viên ${targetUserName}.`;
    } else if (action === 'resolve') {
      updatedSupportStatus = 'RESOLVED';
      systemMsg = `✅ Phiên tư vấn đã được đánh dấu hoàn thành.`;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Update conversation
    if ((prisma as any).conversation) {
      await (prisma as any).conversation.update({
        where: { id: conversationId },
        data: {
          assignedUserId: updatedAssignedUserId,
          assignedUserName: updatedAssignedUserName,
          supportStatus: updatedSupportStatus,
        },
      });
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE public.nenkin_conversations SET "assignedUserId" = $1, "assignedUserName" = $2, "supportStatus" = $3 WHERE id = $4`,
        updatedAssignedUserId,
        updatedAssignedUserName,
        updatedSupportStatus,
        conversationId
      );
    }

    // Add system message if applicable
    if (systemMsg) {
      if ((prisma as any).message) {
        await (prisma as any).message.create({
          data: {
            conversationId,
            senderUserId: user.id,
            content: systemMsg,
            type: 'SYSTEM',
          },
        });
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO public.nenkin_messages (id, "conversationId", "senderUserId", content, type, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())`,
          `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          conversationId,
          user.id,
          systemMsg,
          'SYSTEM'
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        assignedUserId: updatedAssignedUserId,
        assignedUserName: updatedAssignedUserName,
        supportStatus: updatedSupportStatus,
      },
    });
  } catch (err: any) {
    console.error('Assign conversation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

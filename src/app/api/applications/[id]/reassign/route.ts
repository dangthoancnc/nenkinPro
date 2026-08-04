import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { assignedUserId, note } = body;

    // 1. Fetch application and customer info
    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedUser: { select: { id: true, name: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Hồ sơ không tồn tại' }, { status: 404 });
    }

    // 2. Validate target user if assignedUserId is provided
    let targetUser: { id: string; name: string } | null = null;
    if (assignedUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: assignedUserId },
        select: { id: true, name: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Nhân viên nhận bàn giao không tồn tại' }, { status: 400 });
      }
    }

    // 3. Update application assignedUserId & assignedAt
    const updated = await prisma.nenkinApplication.update({
      where: { id },
      data: {
        assignedUserId: assignedUserId || null,
        assignedAt: assignedUserId ? new Date() : null,
      },
      include: {
        customer: true,
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // 4. Log application history
    const oldStaffName = application.assignedUser?.name || 'Chưa gán';
    const newStaffName = targetUser ? targetUser.name : 'Bỏ gán (Chưa gán)';
    const historyDesc = targetUser
      ? `Bàn giao hồ sơ từ [${oldStaffName}] sang [${newStaffName}]. Ghi chú: ${note || 'Bàn giao công việc'}`
      : `Hủy gán người phụ trách cho hồ sơ (trước đó do [${oldStaffName}] phụ trách).`;

    await prisma.applicationHistory.create({
      data: {
        applicationId: id,
        actorName: user.name,
        action: 'BÀN GIAO HỒ SƠ',
        description: historyDesc,
      },
    });

    // 5. Send Notification to targetUser if assigned
    if (targetUser && targetUser.id !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          title: 'Hồ sơ Nenkin mới được bàn giao',
          content: `${user.name} đã bàn giao hồ sơ khách hàng "${application.customer.fullName}" cho bạn. Ghi chú: ${note || 'Không có'}`,
          type: 'SYSTEM',
          link: `/applications/${id}`,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('Error reassigning application:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

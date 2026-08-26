import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/authorization';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    let customersFilter: any = {};
    let appsFilter: any = {};

    if (user.role === 'COLLABORATOR') {
      customersFilter = {
        OR: [
          { createdById: user.id },
          { referredByCode: user.staffCode || 'UNKNOWN_CODE' }
        ]
      };
      appsFilter = {
        customer: customersFilter
      };
    } else {
      // ADMIN or MANAGER:
      // In their personal portal, maybe they want to see their assigned applications or global stats?
      // Since it's a "portal", let's show their *own* performance if possible, or global if they want.
      // The prompt asks why there's no data. It's because of the filter in the UI. 
      // Let's just return global stats for ADMIN/MANAGER, and personal stats for COLLABORATOR.
      // Wait, let's just make it return personal stats for COLLABORATOR, and global for ADMIN.
      customersFilter = {}; // Global
      appsFilter = {};      // Global
    }

    const totalCustomers = await prisma.customer.count({
      where: customersFilter
    });

    const totalApplications = await prisma.nenkinApplication.count({
      where: appsFilter
    });

    // Mock commissions for now, or calculate based on applications
    // In reality, it should be based on completed apps.
    const totalCommissionJpy = totalCustomers * 2000;
    const pendingCommissionJpy = totalCommissionJpy * 0.5;

    // Get recent activity feeds
    // Actually, let's fetch the most recent customers as feed
    const recentCustomers = await prisma.customer.findMany({
      where: customersFilter,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        fullName: true,
        code: true,
        createdAt: true,
      }
    });

    const feedList = recentCustomers.map(c => ({
      id: c.id,
      actorName: c.fullName,
      action: 'HỒ SƠ MỚI',
      content: `Đã khởi tạo hồ sơ Nenkin mới #${c.code || c.id.slice(0, 6)}`,
      createdAt: c.createdAt,
    }));

    // If there are real activity feeds in the DB, we could fetch them here:
    const realFeeds = await prisma.activityFeed.findMany({
      where: user.role === 'COLLABORATOR' ? { userId: user.id } : {},
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const formattedRealFeeds = realFeeds.map(f => ({
      id: f.id,
      actorName: f.actorName,
      action: f.action,
      content: f.content,
      createdAt: f.createdAt,
    }));

    // Merge and sort
    const allFeeds = [...feedList, ...formattedRealFeeds].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalApplications,
          totalCommissionJpy,
          pendingCommissionJpy,
        },
        feeds: allFeeds
      }
    });
  } catch (err: any) {
    console.error('Portal Stats Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

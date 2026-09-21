import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  const { user: employee, error } = await requireStaff();
  if (error || !employee) return error;

  try {
    let customerWhere = {};
    let appWhere: Prisma.NenkinApplicationWhereInput = {};
    if (employee.role === 'COLLABORATOR') {
      customerWhere = { createdById: employee.id };
      appWhere = { customer: { createdById: employee.id } };
    }

    const totalCustomers = await prisma.customer.count({ where: customerWhere });
    const processingApps = await prisma.nenkinApplication.count({
      where: {
        ...appWhere,
        status: { in: ['SENT_1ST', 'RECEIVED_1ST', 'SENT_2ND'] }
      }
    });
    const completedApps = await prisma.nenkinApplication.count({
      where: { ...appWhere, status: 'COMPLETED' }
    });

    const isCollab = employee.role === 'COLLABORATOR';
    const isManager = employee.role === 'MANAGER';

    // Calculate revenue & commission
    const appsWithRevenue = await prisma.nenkinApplication.findMany({
      where: { ...appWhere, serviceFeeJpy: { not: null } },
      select: { serviceFeeJpy: true, referralBonusJpy: true }
    });
    const totalRevenue = appsWithRevenue.reduce((sum, app) => sum + (Number(app.serviceFeeJpy) || 0), 0);
    const totalMyCommission = appsWithRevenue.reduce((sum, app) => sum + (Number(app.referralBonusJpy) || 3000), 0);

    const kpi4Title = isCollab ? 'Hoa hồng của tôi' : (isManager ? 'Doanh số nhóm' : 'Doanh thu dự kiến');
    const kpi4Value = isCollab 
      ? `¥${totalMyCommission.toLocaleString()}`
      : `¥${(totalRevenue / 1000000).toFixed(1)}M`;

    const kpis = [
      { title: isCollab ? 'Khách hàng của tôi' : 'Tổng Khách hàng', value: totalCustomers.toString(), trend: '+0%', iconName: 'Users', color: 'text-blue-500', bg: 'bg-blue-50' },
      { title: 'Hồ sơ đang xử lý', value: processingApps.toString(), trend: '+0%', iconName: 'Clock', color: 'text-amber-500', bg: 'bg-amber-50' },
      { title: 'Hoàn thành (Lần 1)', value: completedApps.toString(), trend: '+0%', iconName: 'CheckCircle2', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { title: kpi4Title, value: kpi4Value, trend: '+0%', iconName: isCollab ? 'Banknote' : 'TrendingUp', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ];

    const recentAppsData = await prisma.nenkinApplication.findMany({
      take: 5,
      where: appWhere,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    const recentApplications = recentAppsData.map((app) => ({
      id: app.id,
      name: app.customer?.fullName || 'N/A',
      status: app.status,
      date: app.createdAt.toISOString().split('T')[0],
      amount: app.totalExpectedJpy ? `¥${app.totalExpectedJpy.toString()}` : 'N/A'
    }));

    // Hide company-wide revenue data from Collaborators
    const revenueData = isCollab ? [] : [
      { month: 'T1', revenue: 0 },
      { month: 'T2', revenue: 0 },
      { month: 'T3', revenue: 0 },
      { month: 'T4', revenue: 0 },
      { month: 'T5', revenue: totalRevenue / 1000000 },
    ];

    return NextResponse.json({ 
      success: true, 
      data: { 
        role: employee.role,
        kpis, 
        recentApplications, 
        revenueData 
      } 
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}


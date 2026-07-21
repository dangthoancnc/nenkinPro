import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const totalCustomers = await prisma.customer.count();
    const pendingApps = await prisma.nenkinApplication.count({
      where: {
        status: { in: ['SENT_1ST', 'SENT_2ND'] }
      }
    });
    const completedApps = await prisma.nenkinApplication.count({
      where: {
        status: { in: ['RECEIVED_1ST', 'RECEIVED_2ND', 'COMPLETED'] }
      }
    });
    
    const apps = await prisma.nenkinApplication.findMany({
      select: { totalExpectedJpy: true }
    });
    const revenue = apps.reduce((sum, app) => sum + (Number(app.totalExpectedJpy) || 0), 0);
    
    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        pendingApps,
        completedApps,
        revenue: `¥${revenue.toLocaleString()}`
      }
    });
  } catch (error) {
    console.error('KPIs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


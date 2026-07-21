import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const recentApps = await prisma.nenkinApplication.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });
    
    const formatted = recentApps.map(app => ({
      id: app.id.slice(0, 8).toUpperCase(),
      name: app.customer.fullName,
      status: app.status,
      date: app.createdAt.toISOString().split('T')[0],
      amount: app.totalExpectedJpy ? `¥${app.totalExpectedJpy.toString()}` : 'Chưa tính'
    }));
    
    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Recent apps error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


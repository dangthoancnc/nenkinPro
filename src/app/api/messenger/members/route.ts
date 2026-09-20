import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { calculatePresence, extractLatestActivity } from '@/lib/messenger/presence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const now = Date.now();

    const staffs = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
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

    const customers = await prisma.customer.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        code: true,
        phone: true,
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

    return NextResponse.json({
      success: true,
      data: {
        staffs: staffs.map(s => {
          const isSelf = s.id === user.id;
          const latest = extractLatestActivity(s);
          const { isOnline, lastActiveText } = calculatePresence(isSelf, latest, now);

          return {
            id: s.id,
            name: s.name,
            role: s.role === 'ADMIN' ? 'Quản trị viên' : s.role === 'MANAGER' ? 'Quản lý' : 'Cộng tác viên (CTV)',
            code: s.staffCode || s.id.slice(0, 8),
            type: 'STAFF',
            isOnline,
            lastActiveText,
          };
        }),
        customers: customers.map(c => {
          const latest = extractLatestActivity(c);
          const { isOnline, lastActiveText } = calculatePresence(false, latest, now);

          return {
            id: c.id,
            name: c.fullName,
            code: c.code,
            phone: c.phone || 'Chưa có SĐT',
            type: 'CUSTOMER',
            isOnline,
            lastActiveText,
          };
        }),
      },
    });
  } catch (err: any) {
    console.error('Fetch messenger members error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

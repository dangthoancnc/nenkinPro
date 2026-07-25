import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const staffs = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        staffCode: true,
      },
    });

    const customers = await prisma.customer.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        code: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        staffs: staffs.map(s => ({
          id: s.id,
          name: s.name,
          role: s.role === 'ADMIN' ? 'Quản trị viên' : s.role === 'MANAGER' ? 'Quản lý' : 'Cộng tác viên (CTV)',
          code: s.staffCode || s.id.slice(0, 8),
          type: 'STAFF',
        })),
        customers: customers.map(c => ({
          id: c.id,
          name: c.fullName,
          code: c.code,
          phone: c.phone || 'Chưa có SĐT',
          type: 'CUSTOMER',
        })),
      },
    });
  } catch (err: any) {
    console.error('Fetch messenger members error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

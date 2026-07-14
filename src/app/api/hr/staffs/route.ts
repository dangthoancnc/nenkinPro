import { requireRole } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { user, error } = await requireRole(['ADMIN']);
  if (error || !user) return error;

  try {
    const staffs = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        staffCode: true
      }
    });
    
    const formatted = staffs.map(staff => ({
      id: staff.staffCode || staff.id.slice(0, 8).toUpperCase(),
      name: staff.name,
      role: staff.role === 'ADMIN' ? 'Quản trị viên' : staff.role === 'MANAGER' ? 'Quản lý' : 'Cộng tác viên',
      department: 'Nghiệp vụ Nenkin', // Assuming static for now or derivable
      email: staff.email,
      status: 'Hoạt động'
    }));
    
    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Staff error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


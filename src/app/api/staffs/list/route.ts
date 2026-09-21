import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    
    let whereRole: any = { in: ['ADMIN', 'MANAGER', 'COLLABORATOR'] };
    if (roleParam === 'STAFF') {
      whereRole = { in: ['ADMIN', 'MANAGER'] };
    } else if (roleParam === 'COLLABORATOR') {
      whereRole = 'COLLABORATOR';
    }

    const staffs = await prisma.user.findMany({
      where: {
        role: whereRole
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        staffCode: true
      }
    });

    return NextResponse.json({ success: true, data: staffs });
  } catch (err: any) {
    console.error('Error fetching staff list for assignment:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

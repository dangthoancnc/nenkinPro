import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const staffs = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'MANAGER']
        }
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

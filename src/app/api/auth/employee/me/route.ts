import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('employee_auth')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, email: true }
    });

    if (!user) {
      // Invalid cookie
      cookieStore.delete('employee_auth');
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });

  } catch (error: unknown) {
    console.error('Employee Me Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

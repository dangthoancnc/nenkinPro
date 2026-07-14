import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const representatives = await prisma.taxRepresentative.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(representatives);
  } catch (error) {
    console.error('Error fetching tax representatives:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

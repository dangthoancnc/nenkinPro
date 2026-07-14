import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateEmployee } from '@/lib/serverAuth';

export async function GET() {
  const employee = await validateEmployee();
  if (!employee) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

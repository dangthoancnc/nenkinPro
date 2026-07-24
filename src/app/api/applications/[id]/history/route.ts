import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const { id } = await params;

    const histories = await prisma.applicationHistory.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: histories });
  } catch (err: any) {
    console.error('Fetch Application History Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, description } = body;

    if (!action || !description) {
      return NextResponse.json({ success: false, error: 'Action and description are required' }, { status: 400 });
    }

    const history = await prisma.applicationHistory.create({
      data: {
        applicationId: id,
        actorName: user.name || user.email || 'Nhân viên',
        action,
        description,
      }
    });

    return NextResponse.json({ success: true, data: history });
  } catch (err: any) {
    console.error('Create Application History Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

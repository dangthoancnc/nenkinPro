import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) {
      return error || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const histories = await prisma.applicationHistory.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(err => {
      console.warn('Application history findMany warning:', err?.message);
      return [];
    });

    return NextResponse.json({ success: true, data: histories });
  } catch (err: any) {
    console.error('Fetch Application History Error:', err);
    return NextResponse.json({ success: true, data: [], message: err?.message || 'Internal error' });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) {
      return error || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

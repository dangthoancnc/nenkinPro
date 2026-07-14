import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Update NenkinApplication status to DRAFT and Customer status to VERIFIED
      await prisma.$transaction([
        prisma.nenkinApplication.update({
          where: { id },
          data: { status: 'DRAFT' }
        }),
        prisma.customer.update({
          where: { id: application.customerId },
          data: { status: 'VERIFIED' }
        })
      ]);
      return NextResponse.json({ success: true, status: 'DRAFT' });
    } else if (action === 'REJECT') {
      // Update NenkinApplication status to CANCELLED
      await prisma.nenkinApplication.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
      return NextResponse.json({ success: true, status: 'CANCELLED' });
    }
  } catch (error) {
    console.error('Error in review action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { requireStaff, requireCustomerAccess } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    let whereClause = {};
    if (user.role === 'COLLABORATOR') {
      whereClause = { customer: { createdById: user.id } };
    }

    const applications = await prisma.nenkinApplication.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, status, applyDate, totalExpectedJpy } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const { user, error } = await requireCustomerAccess(customerId);
    if (error || !user) return error;

    const newApplication = await prisma.nenkinApplication.create({
      data: {
        customerId,
        status: status || 'DRAFT',
        applyDate: applyDate ? new Date(applyDate) : null,
        totalExpectedJpy: totalExpectedJpy || null,
      },
    });

    return NextResponse.json(newApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


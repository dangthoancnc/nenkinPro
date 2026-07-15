import { validateEmployee } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const employee = await validateEmployee();
  if (!employee) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const applications = await prisma.nenkinApplication.findMany({
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
  const employee = await validateEmployee();
  if (!employee) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, status, applyDate, totalExpectedJpy } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

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


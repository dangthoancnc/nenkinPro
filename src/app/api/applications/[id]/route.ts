import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapApplicationToTemplate } from '@/lib/documentMapper';

export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { taxOffice: true }
        },
        taxRepresentative: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const mappedData = mapApplicationToTemplate(application);

    return NextResponse.json({ ...application, mappedData });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedApplication = await prisma.nenkinApplication.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.nenkinApplication.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


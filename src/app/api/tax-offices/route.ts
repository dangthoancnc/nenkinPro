import { requireStaff, requireRole } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const taxOffices = await prisma.taxOffice.findMany({
      include: {
        _count: {
          select: { customers: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ success: true, data: taxOffices });
  } catch (error: unknown) {
    console.error('Fetch Tax Offices Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Tên Cục thuế là bắt buộc' }, { status: 400 });
    }

    // Try to find existing
    let taxOffice = await prisma.taxOffice.findFirst({
      where: { name: body.name }
    });

    if (taxOffice) {
      // Return existing
      return NextResponse.json({ success: true, data: taxOffice, isNew: false }, { status: 200 });
    }

    // Create new
    taxOffice = await prisma.taxOffice.create({
      data: {
        name: body.name,
        romajiName: body.romajiName || '',
        address: body.address || '',
        romajiAddress: body.romajiAddress || '',
        postalCode: body.postalCode || '',
        phone: body.phone || '',
        websiteUrl: body.websiteUrl || '',
        mapUrl: body.mapUrl || '',
        receptionInfo: body.receptionInfo || '',
        notes: body.notes || ''
      }
    });

    return NextResponse.json({ success: true, data: taxOffice, isNew: true }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create Tax Office Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}


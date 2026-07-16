import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapDocument, mapApplicationToTemplate, TemplateType } from '@/lib/documentMapper';
import { requireApplicationAccess } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;
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

    const workHistories = await prisma.workHistory.findMany({
      where: { customerId: application.customerId },
      orderBy: { startDate: 'asc' }
    });

    const mapperInput = {
      application,
      customer: application.customer,
      workHistories,
      taxOffice: application.customer.taxOffice,
      taxRepresentative: application.taxRepresentative,
    };

    const templates: TemplateType[] = ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1', 'nouzeikanrinin', 'bang_1_2', 'bang_3', 'giay_uy_thac_lan_2'];
    let mappedData: Record<string, string> = {};
    
    // Fallback legacy compatibility mapping first
    try {
      mappedData = { ...mapApplicationToTemplate(application) };
    } catch (e) {
      // ignore
    }

    // Merge advanced mapping for all forms
    for (const t of templates) {
      try {
        const data = mapDocument(mapperInput, t);
        mappedData = { ...mappedData, ...data };
      } catch (e) {
        // ignore
      }
    }

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
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;
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
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;
    await prisma.nenkinApplication.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


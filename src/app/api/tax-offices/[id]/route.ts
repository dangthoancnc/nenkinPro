import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: authError } = await requireStaff();
    if (authError || !user) return authError;

    const { id } = await params;
    const body = await req.json();

    const taxOffice = await prisma.taxOffice.update({
      where: { id },
      data: {
        name: body.name,
        romajiName: body.romajiName,
        address: body.address,
        romajiAddress: body.romajiAddress,
        postalCode: body.postalCode,
        phone: body.phone,
        websiteUrl: body.websiteUrl,
        mapUrl: body.mapUrl,
        receptionInfo: body.receptionInfo,
        notes: body.notes
      }
    });

    return NextResponse.json({ success: true, data: taxOffice });
  } catch (error: unknown) {
    console.error('Update Tax Office Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: authError } = await requireStaff();
    if (authError || !user) return authError;

    const { id } = await params;

    // Check if tax office has customers
    const customerCount = await prisma.customer.count({
      where: { taxOfficeId: id }
    });

    if (customerCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Không thể xóa Cục thuế này vì đang có ${customerCount} khách hàng trực thuộc. Hãy đổi cục thuế cho khách hàng trước.`
      }, { status: 400 });
    }

    await prisma.taxOffice.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa Cục thuế thành công' });
  } catch (error: unknown) {
    console.error('Delete Tax Office Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

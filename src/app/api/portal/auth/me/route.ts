import { NextResponse } from 'next/server';
import { requireCustomerSession } from '@/lib/auth/requireCustomerSession';
import { toCustomerPortalDTO } from '@/lib/dto/customerPortalDTO';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { session } = await requireCustomerSession();

    // Session already includes the customer object, but we need to fetch related applications and ocrResults for the DTO
    const customerWithRelations = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        applications: true,
        ocrResults: true
      }
    });

    if (!customerWithRelations) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const dto = toCustomerPortalDTO(customerWithRelations);

    return NextResponse.json({ success: true, customer: dto });
  } catch (error: unknown) {
    console.error('Fetch Me Error:', error);
    if ((error as Error).message === '401_UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if ((error as Error).message === '403_PIN_RESET_REQUIRED') {
      return NextResponse.json({ success: false, error: 'PIN Reset Required', requireReset: true }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

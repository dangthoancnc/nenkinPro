import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomerSession } from '@/lib/auth/requireCustomerSession';

// GET removed, use /api/portal/auth/me instead

export async function PUT(request: Request) {
  try {
    const { session } = await requireCustomerSession();
    const customerId = session.customerId;

    const body = await request.json();
    const allowedUpdates = ['zairyuFrontUrl', 'zairyuBackUrl', 'passportUrl', 'nenkinBookUrl', 'bankPassbookUrl', 'securityPhotoUrl'];
    const updateData: Record<string, string> = {};
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const currentCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!currentCustomer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // Kiểm tra trạng thái hồ sơ
    const appStatus = currentCustomer.applications?.[0]?.status || 'DRAFT';
    const allowedStatuses = ['PENDING', 'DRAFT', 'REVISION_REQUIRED'];
    if (!allowedStatuses.includes(appStatus)) {
      return NextResponse.json({ success: false, error: 'Cannot update files in current status' }, { status: 403 });
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    if ((error as Error).message?.includes('401') || (error as Error).message?.includes('403')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

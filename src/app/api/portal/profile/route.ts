import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get('portal_auth')?.value;

  if (!customerId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      applications: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!customer) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: customer });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get('portal_auth')?.value;

  if (!customerId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // Xử lý tự động chuyển trạng thái nếu đang là REVISION_REQUIRED
    // Tạm thời giữ nguyên hoặc có thể update Application, ở đây chỉ update Customer
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

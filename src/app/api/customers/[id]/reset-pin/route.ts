import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const newPin = body.newPin ? body.newPin.trim() : '123456';

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        passwordPin: newPin,
        pinResetRequired: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã đặt lại mã PIN cho khách hàng ${customer.fullName} thành [${newPin}]`,
      pinCode: newPin,
    });
  } catch (err: any) {
    console.error('Reset customer PIN error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

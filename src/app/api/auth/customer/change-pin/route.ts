import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawToken = request.cookies.get('nenkin_customer_token')?.value;
    if (!rawToken) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await prisma.customerSession.findUnique({ where: { tokenHash } });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Phiên làm việc hết hạn' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập đầy đủ Mã PIN hiện tại và Mã PIN mới.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
    if (!customer) return NextResponse.json({ success: false, error: 'Khách hàng không tồn tại' }, { status: 404 });

    const validPin = customer.passwordPin || '123456';
    if (currentPin.trim() !== validPin) {
      return NextResponse.json({ success: false, error: 'Mã PIN hiện tại không đúng.' }, { status: 400 });
    }

    if (newPin.trim().length < 4) {
      return NextResponse.json({ success: false, error: 'Mã PIN mới phải từ 4-6 chữ số.' }, { status: 400 });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordPin: newPin.trim(),
        pinResetRequired: false,
      },
    });

    return NextResponse.json({ success: true, message: 'Đổi mã PIN thành công!' });
  } catch (err: any) {
    console.error('Change PIN error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

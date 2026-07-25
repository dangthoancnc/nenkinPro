import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loginId, pinCode } = body;

    if (!loginId || !pinCode) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập Mã thẻ ngoại kiều / Mã hồ sơ / SĐT và Mã PIN.' },
        { status: 400 }
      );
    }

    const cleanId = loginId.trim();
    const cleanPin = pinCode.trim();

    // Find customer by cardNumber, code, or phone
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { cardNumber: cleanId },
          { code: cleanId },
          { phone: cleanId },
        ],
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hồ sơ khách hàng. Vui lòng kiểm tra lại.' },
        { status: 401 }
      );
    }

    // Default PIN fallback if passwordPin is null in DB
    const validPin = customer.passwordPin || '123456';

    if (cleanPin !== validPin) {
      return NextResponse.json(
        { success: false, error: 'Mã PIN không chính xác. Vui lòng thử lại hoặc liên hệ Nhân viên để hỗ trợ.' },
        { status: 401 }
      );
    }

    // If passwordPin was null, save default PIN 123456
    if (!customer.passwordPin) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { passwordPin: '123456' },
      });
    }

    // Generate session token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.customerSession.create({
      data: {
        tokenHash,
        customerId: customer.id,
        expiresAt,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      customer: {
        id: customer.id,
        code: customer.code,
        fullName: customer.fullName,
        cardNumber: customer.cardNumber,
        phone: customer.phone,
      },
    });

    response.cookies.set({
      name: 'nenkin_customer_token',
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (err: any) {
    console.error('Customer login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

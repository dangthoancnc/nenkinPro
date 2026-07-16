import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import * as argon2 from 'argon2';

export async function POST(req: Request) {
  try {
    const { action, cardNumber, passwordPin, staffCode, fullName } = await req.json();

    if (action !== 'register') {
      return NextResponse.json({ success: false, error: 'Hành động không hợp lệ.' }, { status: 400 });
    }

    if (!cardNumber || !passwordPin) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập định danh và mã PIN.' }, { status: 400 });
    }

    if (!staffCode || !fullName) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập Tên và Mã Nhân Viên.' }, { status: 400 });
    }

    const staff = await prisma.user.findUnique({
      where: { staffCode: staffCode.toUpperCase() }
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'Mã Nhân Viên không tồn tại.' }, { status: 400 });
    }

    const identifier = cardNumber.toUpperCase().trim();
    const existing = await prisma.customer.findFirst({
      where: { cardNumber: identifier }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Mã Thẻ đã được đăng ký. Vui lòng đăng nhập.' }, { status: 400 });
    }

    // Hash PIN with Argon2 immediately for new customers
    const passwordPinHash = await argon2.hash(passwordPin);

    const customer = await prisma.customer.create({
      data: {
        code: `KH-${Date.now().toString().slice(-6)}`,
        fullName: fullName.toUpperCase(),
        cardNumber: identifier,
        passwordPin: passwordPinHash,
        pinResetRequired: false, // New customer knows their PIN
        dob: new Date('1900-01-01'), // Temporary
        createdById: staff.id,
        status: 'NEW'
      }
    });

    // Generate session for new customer
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Hash IP properly
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const ipHash = rawIp !== 'unknown' ? crypto.createHash('sha256').update(rawIp).digest('hex') : null;

    await prisma.customerSession.create({
      data: {
        tokenHash,
        customerId: customer.id,
        expiresAt,
        ipHash,
        userAgent: req.headers.get('user-agent') || null,
      }
    });

    const cookieStore = await cookies();
    cookieStore.delete('portal_auth');
    cookieStore.set('nenkin_customer_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Portal Register Error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

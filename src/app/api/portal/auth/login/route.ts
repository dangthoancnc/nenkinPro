import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import * as argon2 from 'argon2';

export async function POST(req: Request) {
  try {
    const { action, cardNumber, passwordPin, staffCode, fullName } = await req.json();

    if (!cardNumber || !passwordPin) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập định danh và mã PIN.' }, { status: 400 });
    }

    if (action === 'login') {
      const identifier = cardNumber.toUpperCase().trim();
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { cardNumber: identifier },
            { code: identifier }
          ]
        }
      });

      if (!customer || !customer.passwordPin) {
        return NextResponse.json({ success: false, error: 'Thông tin đăng nhập không chính xác.' }, { status: 401 });
      }

      if (customer.pinResetRequired) {
        return NextResponse.json({ success: false, error: 'Yêu cầu đổi mã PIN.', requireReset: true }, { status: 403 });
      }

      let isValid = false;
      try {
        isValid = await argon2.verify(customer.passwordPin, passwordPin);
      } catch (e) {
        console.error('Argon2 verify error:', e);
      }

      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Thông tin đăng nhập không chính xác.' }, { status: 401 });
      }

      // 1. Revoke old sessions
      await prisma.customerSession.updateMany({
        where: { customerId: customer.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      // 2. Generate 32-byte token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // 3. Save to DB
      await prisma.customerSession.create({
        data: {
          tokenHash,
          customerId: customer.id,
          expiresAt,
          ipHash: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        }
      });

      // 4. Set cookie
      const cookieStore = await cookies();
      cookieStore.delete('portal_auth'); // Clean up old legacy cookie
      cookieStore.set('nenkin_customer_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'register') {
      if (!staffCode || !fullName) {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập Tên và Mã Nhân Viên.' }, { status: 400 });
      }

      const staff = await prisma.user.findUnique({
        where: { staffCode: staffCode.toUpperCase() }
      });

      if (!staff) {
        return NextResponse.json({ success: false, error: 'Mã Nhân Viên không tồn tại.' }, { status: 400 });
      }

      const existing = await prisma.customer.findFirst({
        where: { cardNumber: cardNumber.toUpperCase() }
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
          cardNumber: cardNumber.toUpperCase(),
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

      await prisma.customerSession.create({
        data: {
          tokenHash,
          customerId: customer.id,
          expiresAt,
          ipHash: req.headers.get('x-forwarded-for') || null,
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
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ.' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Portal Auth Error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

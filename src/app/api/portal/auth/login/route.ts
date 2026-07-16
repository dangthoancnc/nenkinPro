import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import * as argon2 from 'argon2';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rateLimit';

export async function POST(req: Request) {
  try {
    const { action, cardNumber, passwordPin } = await req.json();

    if (!cardNumber || !passwordPin) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập định danh và mã PIN.' }, { status: 400 });
    }

    if (action !== 'login') {
      return NextResponse.json({ success: false, error: 'Hành động không hợp lệ.' }, { status: 400 });
    }

    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const identifier = cardNumber.toUpperCase().trim();

    // Check rate limit
    if (!checkRateLimit(rawIp, identifier)) {
      return NextResponse.json({ success: false, error: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.' }, { status: 429 });
    }

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

    // Reset rate limit on success
    resetRateLimit(rawIp, identifier);

    // 1. Revoke old sessions
    await prisma.customerSession.updateMany({
      where: { customerId: customer.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    // 2. Generate 32-byte token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 3. Hash IP properly
    const ipHash = rawIp !== 'unknown' ? crypto.createHash('sha256').update(rawIp).digest('hex') : null;

    // 4. Save to DB
    await prisma.customerSession.create({
      data: {
        tokenHash,
        customerId: customer.id,
        expiresAt,
        ipHash,
        userAgent: req.headers.get('user-agent') || null,
      }
    });

    // 5. Set cookie
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

  } catch (error: unknown) {
    console.error('Portal Auth Error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

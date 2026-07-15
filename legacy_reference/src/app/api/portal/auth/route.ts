import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { action, cardNumber, passwordPin, staffCode, fullName } = await req.json();

    if (!cardNumber || !passwordPin) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập Mã Thẻ và Năm sinh.' }, { status: 400 });
    }

    if (action === 'login') {
      // Try to find by cardNumber first, then by code (mã hồ sơ)
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { cardNumber: cardNumber.toUpperCase() },
            { code: cardNumber.toUpperCase() }
          ],
          passwordPin: passwordPin
        }
      });

      if (!customer) {
        return NextResponse.json({ success: false, error: 'Thông tin đăng nhập không chính xác.' }, { status: 401 });
      }

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set('portal_auth', customer.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

      return NextResponse.json({ success: true, customerId: customer.id });
    } 
    
    if (action === 'register') {
      if (!staffCode || !fullName) {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập Tên và Mã Nhân Viên.' }, { status: 400 });
      }

      // Check if staff exists
      const staff = await prisma.user.findUnique({
        where: { staffCode: staffCode.toUpperCase() }
      });

      if (!staff) {
        return NextResponse.json({ success: false, error: 'Mã Nhân Viên không tồn tại.' }, { status: 400 });
      }

      // Check if customer exists
      const existing = await prisma.customer.findFirst({
        where: { cardNumber: cardNumber.toUpperCase() }
      });

      if (existing) {
        return NextResponse.json({ success: false, error: 'Mã Thẻ đã được đăng ký. Vui lòng đăng nhập.' }, { status: 400 });
      }

      // Create new customer
      const customer = await prisma.customer.create({
        data: {
          code: `KH-${Date.now().toString().slice(-6)}`,
          fullName: fullName.toUpperCase(),
          cardNumber: cardNumber.toUpperCase(),
          passwordPin: passwordPin,
          dob: new Date(`${passwordPin}-01-01`), // Temporary date, will update from Zairyu later
          createdById: staff.id,
          status: 'NEW'
        }
      });

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set('portal_auth', customer.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

      return NextResponse.json({ success: true, customerId: customer.id });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ.' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Portal Auth Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

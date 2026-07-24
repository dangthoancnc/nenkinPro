import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, fullName, cardNumber } = body;

    const cleanCard = typeof cardNumber === 'string' ? cardNumber.trim() : null;
    const rawPhone = typeof phone === 'string' ? phone.trim() : null;
    const cleanName = typeof fullName === 'string' ? fullName.trim() : null;
    const phoneDigits = rawPhone ? rawPhone.replace(/\D/g, '') : '';

    let existingCustomer = null;

    if (cleanCard) {
      existingCustomer = await prisma.customer.findUnique({
        where: { cardNumber: cleanCard },
        select: { code: true, fullName: true, phone: true }
      });
    }

    if (!existingCustomer && phoneDigits && phoneDigits.length >= 8) {
      // Find customer by matching phone digits
      const allCustomers = await prisma.customer.findMany({
        where: { phone: { not: null } },
        select: { id: true, code: true, fullName: true, phone: true }
      });

      existingCustomer = allCustomers.find(c => {
        if (!c.phone) return false;
        const dbPhoneDigits = c.phone.replace(/\D/g, '');
        return dbPhoneDigits.includes(phoneDigits) || phoneDigits.includes(dbPhoneDigits);
      }) || null;
    }

    if (!existingCustomer && cleanName && cleanName.length >= 3) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          fullName: { equals: cleanName, mode: 'insensitive' }
        },
        select: { id: true, code: true, fullName: true, phone: true }
      });
    }

    if (existingCustomer) {
      return NextResponse.json({
        isExisting: true,
        customerCode: existingCustomer.code,
        fullName: existingCustomer.fullName,
        message: `Hồ sơ của quý khách (${existingCustomer.fullName}) đã tồn tại trong hệ thống với Mã hồ sơ: ${existingCustomer.code}. Vì lý do bảo mật, quý khách vui lòng Đăng Nhập để xem/bổ sung tài liệu.`
      });
    }

    return NextResponse.json({ isExisting: false });
  } catch (err: any) {
    console.error('Check Duplicate API Error:', err);
    return NextResponse.json({ isExisting: false, error: err.message });
  }
}

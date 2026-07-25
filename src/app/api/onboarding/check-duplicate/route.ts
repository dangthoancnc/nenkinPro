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

    const customerSelect = {
      id: true,
      code: true,
      fullName: true,
      phone: true,
      applications: {
        select: { id: true },
        orderBy: { createdAt: 'desc' as const },
        take: 1
      }
    };

    if (cleanCard) {
      existingCustomer = await prisma.customer.findUnique({
        where: { cardNumber: cleanCard },
        select: customerSelect
      });
    }

    if (!existingCustomer && phoneDigits && phoneDigits.length >= 8) {
      const allCustomers = await prisma.customer.findMany({
        where: { phone: { not: null } },
        select: customerSelect
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
        select: customerSelect
      });
    }

    if (existingCustomer) {
      const latestApp = existingCustomer.applications?.[0];
      return NextResponse.json({
        isExisting: true,
        customerId: existingCustomer.id,
        customerCode: existingCustomer.code,
        applicationId: latestApp?.id || null,
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

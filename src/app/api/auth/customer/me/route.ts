import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rawToken = request.cookies.get('nenkin_customer_token')?.value;
    if (!rawToken) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = await prisma.customerSession.findUnique({
      where: { tokenHash },
      include: {
        customer: {
          include: {
            applications: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                histories: { orderBy: { createdAt: 'desc' } },
              },
            },
            bankAccounts: true,
            taxOffice: true,
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Phiên đăng nhập đã hết hạn' }, { status: 401 });
    }

    const customer = session.customer;

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        code: customer.code,
        cardNumber: customer.cardNumber,
        fullName: customer.fullName,
        dob: customer.dob,
        phone: customer.phone,
        passwordPin: customer.passwordPin || '123456',
        zairyuAddress: customer.zairyuAddress,
        zairyuFrontUrl: customer.zairyuFrontUrl,
        zairyuBackUrl: customer.zairyuBackUrl,
        passportUrl: customer.passportUrl,
        nenkinBookUrl: customer.nenkinBookUrl,
        applications: customer.applications,
        bankAccounts: customer.bankAccounts,
        taxOffice: customer.taxOffice,
      },
    });
  } catch (err: any) {
    console.error('Customer me error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

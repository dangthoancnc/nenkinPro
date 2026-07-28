import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetCustomerId = searchParams.get('id');
    const rawToken = request.cookies.get('nenkin_customer_token')?.value;

    let customer: any = null;
    let isStaffPreview = false;
    let staffUser: any = null;

    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const session = await prisma.customerSession.findUnique({
        where: { tokenHash },
        include: {
          customer: {
            include: {
              applications: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { histories: { orderBy: { createdAt: 'desc' } } },
              },
              bankAccounts: true,
              taxOffice: true,
            },
          },
        },
      });

      if (session && !session.revokedAt && session.expiresAt >= new Date()) {
        customer = session.customer;
      }
    }

    // Fallback: If no valid customer token, check if Staff/Admin is logged in!
    if (!customer) {
      const { user } = await requireStaff();
      if (user) {
        staffUser = { id: user.id, name: user.name, role: user.role };
        isStaffPreview = true;

        if (targetCustomerId) {
          customer = await prisma.customer.findFirst({
            where: {
              OR: [
                { id: targetCustomerId },
                { code: targetCustomerId },
                { applications: { some: { id: targetCustomerId } } },
              ],
            },
            include: {
              applications: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { histories: { orderBy: { createdAt: 'desc' } } },
              },
              bankAccounts: true,
              taxOffice: true,
            },
          });
        } else {
          customer = await prisma.customer.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
              applications: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { histories: { orderBy: { createdAt: 'desc' } } },
              },
              bankAccounts: true,
              taxOffice: true,
            },
          });
        }
      }
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      isStaffPreview,
      staffUser,
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

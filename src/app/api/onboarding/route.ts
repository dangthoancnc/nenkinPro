import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const onboardingSchema = z.object({
  fullName: z.string().max(255).nullable().optional(),
  phone: z.string().max(255).nullable().optional(),
  dob: z.coerce.date().min(new Date('1800-01-01')).max(new Date('2100-01-01')).optional().nullable(),
  ref: z.string().max(255).nullable().optional(),
  zairyuFrontUrl: z.string().max(2048).nullable().optional(),
  zairyuBackUrl: z.string().max(2048).nullable().optional(),
  passportUrl: z.string().max(2048).nullable().optional(),
  nenkinBookUrl: z.string().max(2048).nullable().optional(),
  bankPassbookUrl: z.string().max(2048).nullable().optional(),
  cardNumber: z.string().max(255).nullable().optional(),
  zairyuAddress: z.string().max(255).nullable().optional(),
  securityPhotoUrl: z.string().max(2048).nullable().optional(),
}).strict();

export async function POST(req: Request) {
  try {
    let rawBody;
    try {
      rawBody = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const result = onboardingSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request payload', details: result.error.issues }, { status: 400 });
    }

    const {
      fullName,
      phone,
      dob,
      ref,
      zairyuFrontUrl,
      zairyuBackUrl,
      passportUrl,
      nenkinBookUrl,
      bankPassbookUrl,
      cardNumber,
      zairyuAddress,
      securityPhotoUrl
    } = result.data;

    const parsedDob = dob || new Date();

    // Auto-generate passwordPin from birth year
    const passwordPin = parsedDob.getFullYear().toString();

    // 1. Resolve referral code (staffCode or customer code)
    let createdById: string | null = null;
    let referralType: 'STAFF' | 'CUSTOMER' | null = null;
    let referredByCustomerId: string | null = null;

    if (ref) {
      // First, try to find a staff member by staffCode
      const staffUser = await prisma.user.findUnique({
        where: { staffCode: ref.toUpperCase() }
      });

      if (staffUser) {
        createdById = staffUser.id;
        referralType = 'STAFF';
      } else {
        // If not a staff code, try customer code
        const referringCustomer = await prisma.customer.findUnique({
          where: { code: ref.toUpperCase() }
        });

        if (referringCustomer) {
          referredByCustomerId = referringCustomer.id;
          referralType = 'CUSTOMER';
          // Also assign to the same staff that manages the referring customer
          createdById = referringCustomer.createdById;
        } else {
          return NextResponse.json(
            { success: false, error: 'Mã giới thiệu không hợp lệ. Vui lòng kiểm tra lại mã nhân viên hoặc mã khách hàng.' },
            { status: 400 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mã giới thiệu (mã nhân viên hoặc mã khách hàng).' },
        { status: 400 }
      );
    }

    // 2. Auto-generate customer code (robust collision handling)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'KH-';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let customer;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const code = generateCode();
        customer = await prisma.customer.create({
          data: {
            code,
            fullName: fullName || '',
            phone: phone || null,
            dob: parsedDob,
            passwordPin: passwordPin,
            status: 'PENDING',
            createdById: createdById,
            cardNumber: cardNumber || null,
            zairyuAddress: zairyuAddress || null,
            zairyuFrontUrl: zairyuFrontUrl || null,
            zairyuBackUrl: zairyuBackUrl || null,
            passportUrl: passportUrl || null,
            nenkinBookUrl: nenkinBookUrl || null,
            bankPassbookUrl: bankPassbookUrl || null,
            securityPhotoUrl: securityPhotoUrl || null,
            referralType: referralType,
            referredByCustomerId: referredByCustomerId,
          }
        });
        break;
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
          const target = (error as { meta?: { target?: string | string[] } }).meta?.target;
          const isCodeCollision = Array.isArray(target)
            ? target.includes('code')
            : (typeof target === 'string' && target.includes('code'));
          if (isCodeCollision) {
            attempts++;
            continue;
          } else {
            return NextResponse.json({ success: false, error: 'Thông tin bị trùng (Unique constraint failed)' }, { status: 400 });
          }
        }
        throw error;
      }
    }

    if (!customer) {
      throw new Error('Failed to create customer with unique code');
    }

    // 3. Create application with referral tracking
    const application = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        referralBonusJpy: referralType === 'STAFF' ? 2000 : null,
        referralDiscountJpy: referralType === 'CUSTOMER' ? 2000 : null,
      }
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        code: customer.code,
        cardNumber: customer.cardNumber,
        fullName: customer.fullName,
        referralType: customer.referralType,
      },
      application: {
        id: application.id,
        referralBonusJpy: application.referralBonusJpy,
        referralDiscountJpy: application.referralDiscountJpy,
      }
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

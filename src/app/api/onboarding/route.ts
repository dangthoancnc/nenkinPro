import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { moveStorageFile } from '@/lib/storageHelper';

const onboardingSchema = z.object({
  fullName: z.string().max(255).nullable().optional(),
  phone: z.string().max(255).nullable().optional(),
  dob: z.coerce.date().min(new Date('1800-01-01')).max(new Date('2100-01-01')).optional().nullable(),
  ref: z.string().max(255).nullable().optional(),
  zaloContact: z.string().max(255).nullable().optional(),
  facebookContact: z.string().max(255).nullable().optional(),
  zairyuFrontUrl: z.string().max(2048).nullable().optional(),
  zairyuBackUrl: z.string().max(2048).nullable().optional(),
  passportUrl: z.string().max(2048).nullable().optional(),
  nenkinBookUrl: z.string().max(2048).nullable().optional(),
  bankPassbookUrl: z.string().max(2048).nullable().optional(),
  cardNumber: z.string().max(255).nullable().optional(),
  zairyuAddress: z.string().max(255).nullable().optional(),
  securityPhotoUrl: z.string().max(2048).nullable().optional(),
  draftId: z.string().max(255).nullable().optional(),
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
      zaloContact,
      facebookContact,
      zairyuFrontUrl,
      zairyuBackUrl,
      passportUrl,
      nenkinBookUrl,
      bankPassbookUrl,
      cardNumber,
      zairyuAddress,
      securityPhotoUrl,
    } = result.data;

    const parsedDob = dob || new Date();
    const passwordPin = parsedDob.getFullYear().toString();

    // Resolve referral code if provided
    let createdById: string | null = null;
    let referralType: 'STAFF' | 'CUSTOMER' | null = null;
    let referredByCustomerId: string | null = null;

    if (ref && ref.trim()) {
      const cleanRef = ref.trim().toUpperCase();
      const staffUser = await prisma.user.findUnique({
        where: { staffCode: cleanRef }
      });

      if (staffUser) {
        createdById = staffUser.id;
        referralType = 'STAFF';
      } else {
        const referringCustomer = await prisma.customer.findUnique({
          where: { code: cleanRef }
        });

        if (referringCustomer) {
          referredByCustomerId = referringCustomer.id;
          referralType = 'CUSTOMER';
          createdById = referringCustomer.createdById;
        }
      }
    }

    // Default createdById to first admin user if not specified
    if (!createdById) {
      const firstAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (firstAdmin) createdById = firstAdmin.id;
    }

    // Auto-generate customer code
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
            zaloContact: zaloContact || null,
            facebookContact: facebookContact || null,
            referralCode: code,
            referredByCode: ref || null,
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
            securityPhotoUrl: securityPhotoUrl || null,
            referralType: referralType,
            referredByCustomerId: referredByCustomerId,
            ...(bankPassbookUrl ? {
              bankAccounts: {
                create: [{
                  bankCountry: 'VIETNAM',
                  purpose: 'BOTH',
                  bankPassbookUrls: [bankPassbookUrl],
                }]
              }
            } : {})
          }
        });
        break;
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!customer) {
      throw new Error('Failed to create customer with unique code');
    }

    // Move any temp draft files to official customer ID
    if (zairyuFrontUrl) await moveStorageFile(zairyuFrontUrl, customer.id, 'zairyuFront');
    if (passportUrl) await moveStorageFile(passportUrl, customer.id, 'passport');
    if (nenkinBookUrl) await moveStorageFile(nenkinBookUrl, customer.id, 'nenkin');
    if (bankPassbookUrl) await moveStorageFile(bankPassbookUrl, customer.id, 'bankPassbook_0');

    // Create application with referral tracking
    const application = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        referralBonusJpy: referralType === 'STAFF' ? 2000 : null,
        referralDiscountJpy: referralType === 'CUSTOMER' ? 2000 : null,
      }
    });

    // Record initial history entry
    await prisma.applicationHistory.create({
      data: {
        applicationId: application.id,
        actorName: 'Khách hàng tự đăng ký',
        action: 'TỰ_ĐĂNG_KÝ',
        description: `Khách hàng ${customer.fullName} (${customer.code}) tự khởi tạo hồ sơ trực tuyến.`
      }
    }).catch(console.error);

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

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
  nenkinNumber: z.string().max(255).nullable().optional(),
  bankPassbookUrl: z.string().max(2048).nullable().optional(),
  bankPassbookUrls: z.array(z.string()).optional(),
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
      nenkinNumber,
      bankPassbookUrl,
      bankPassbookUrls: inputBankUrls,
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

    if (!createdById) {
      const firstAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (firstAdmin) createdById = firstAdmin.id;
    }

    // Consolidate bank passbook URLs
    const finalBankUrls: string[] = [];
    if (Array.isArray(inputBankUrls)) {
      finalBankUrls.push(...inputBankUrls.filter(Boolean));
    }
    if (bankPassbookUrl && !finalBankUrls.includes(bankPassbookUrl)) {
      finalBankUrls.push(bankPassbookUrl);
    }

    const cleanCardNumber = cardNumber?.trim() || null;
    const cleanFullName = fullName?.trim() || '';
    const cleanPhone = phone?.trim() || null;
    const cleanNenkinNumber = nenkinNumber?.trim() || null;

    // --- STRICT DEDUPLICATION CHECK ---
    let existingCustomer = null;

    if (cleanCardNumber) {
      existingCustomer = await prisma.customer.findUnique({
        where: { cardNumber: cleanCardNumber },
        select: { id: true, code: true, fullName: true }
      });
    }

    if (!existingCustomer && cleanPhone && cleanFullName) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: cleanPhone,
          fullName: { equals: cleanFullName, mode: 'insensitive' }
        },
        select: { id: true, code: true, fullName: true }
      });
    } else if (!existingCustomer && cleanPhone) {
      existingCustomer = await prisma.customer.findFirst({
        where: { phone: cleanPhone },
        select: { id: true, code: true, fullName: true }
      });
    }

    if (existingCustomer) {
      return NextResponse.json({
        success: false,
        isExistingCustomer: true,
        customerCode: existingCustomer.code,
        error: `Hồ sơ của quý khách (${existingCustomer.fullName}) đã tồn tại trong hệ thống với Mã hồ sơ: ${existingCustomer.code}. Vì lý do bảo mật, vui lòng Đăng Nhập để xem/bổ sung tài liệu.`
      }, { status: 409 });
    }

    // CREATE NEW CUSTOMER (with unique code generator)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res = 'KH-';
      for (let i = 0; i < 6; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    let customer;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const code = generateCode();
        const createData: any = {
          code,
          fullName: cleanFullName,
          phone: cleanPhone,
          dob: parsedDob,
          passwordPin: passwordPin,
          status: 'PENDING',
          createdById: createdById,
          cardNumber: cleanCardNumber,
          zairyuAddress: zairyuAddress || null,
          zairyuFrontUrl: zairyuFrontUrl || null,
          zairyuBackUrl: zairyuBackUrl || null,
          passportUrl: passportUrl || null,
          nenkinBookUrl: nenkinBookUrl || null,
          nenkinNumber: cleanNenkinNumber,
          securityPhotoUrl: securityPhotoUrl || null,
          referralType: referralType,
          referredByCustomerId: referredByCustomerId,
          zaloContact: zaloContact || null,
          facebookContact: facebookContact || null,
          referralCode: code,
          referredByCode: ref || null,
        };

        if (finalBankUrls.length > 0) {
          createData.bankAccounts = {
            create: [{
              bankCountry: 'VIETNAM',
              purpose: 'BOTH',
              bankPassbookUrls: finalBankUrls,
            }]
          };
        }

        customer = await prisma.customer.create({ data: createData });
        break;
      } catch (error: any) {
        if (error?.code === 'P2002') {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!customer) {
      throw new Error('Không thể khởi tạo mã khách hàng duy nhất. Vui lòng thử lại.');
    }

    // Move temp draft files to official customer ID
    if (zairyuFrontUrl) await moveStorageFile(zairyuFrontUrl, customer.id, 'zairyuFront').catch(console.error);
    if (zairyuBackUrl) await moveStorageFile(zairyuBackUrl, customer.id, 'zairyuBack').catch(console.error);
    if (passportUrl) await moveStorageFile(passportUrl, customer.id, 'passport').catch(console.error);
    if (nenkinBookUrl) await moveStorageFile(nenkinBookUrl, customer.id, 'nenkin').catch(console.error);
    for (let i = 0; i < finalBankUrls.length; i++) {
      await moveStorageFile(finalBankUrls[i], customer.id, `bankPassbook_${i}`).catch(console.error);
    }

    // Create new application
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

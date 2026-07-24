import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { customerSchema } from '@/lib/validations/customerSchema';
import { randomUUID } from 'crypto';
import { moveStorageFile } from '@/lib/storageHelper';

export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const rawBody = await req.json();
    const body = customerSchema.parse(rawBody);
    const taxOffice = rawBody.taxOffice;
    
    // Auto-generate code
    const count = await prisma.customer.count();
    const code = `KH${(count + 1).toString().padStart(3, '0')}`;

    let finalTaxOfficeId = body.taxOfficeId || null;
    if (!finalTaxOfficeId && taxOffice && taxOffice.name) {
      const existing = await prisma.taxOffice.findFirst({
        where: { name: taxOffice.name }
      });
      if (existing) {
        finalTaxOfficeId = existing.id;
      } else {
        const newOffice = await prisma.taxOffice.create({
          data: {
            name: taxOffice.name,
            romajiName: taxOffice.romajiName,
            address: taxOffice.address || '',
            romajiAddress: taxOffice.romajiAddress,
            postalCode: taxOffice.postalCode || '',
            phone: taxOffice.phone,
            mapUrl: taxOffice.mapUrl,
            websiteUrl: taxOffice.websiteUrl,
          }
        });
        finalTaxOfficeId = newOffice.id;
      }
    }

    const customerId = randomUUID();

    // Move all document files from anonymous to customerId
    const zairyuFrontUrl = body.zairyuFrontUrl ? await moveStorageFile(body.zairyuFrontUrl, customerId, 'zairyuFront') : '';
    const zairyuBackUrl = body.zairyuBackUrl ? await moveStorageFile(body.zairyuBackUrl, customerId, 'zairyuBack') : '';
    const passportUrl = body.passportUrl ? await moveStorageFile(body.passportUrl, customerId, 'passport') : '';
    const departureStampUrl = body.departureStampUrl ? await moveStorageFile(body.departureStampUrl, customerId, 'departureStamp') : '';
    const nenkinBookUrl = body.nenkinBookUrl ? await moveStorageFile(body.nenkinBookUrl, customerId, 'nenkinBook') : '';

    const bankAccounts = body.bankAccounts ? await Promise.all(body.bankAccounts.map(async (acc: any, index: number) => {
      const urls = acc.bankPassbookUrls || [];
      const newUrls = await Promise.all(urls.map((url: string) => moveStorageFile(url, customerId, `bankPassbook_${index}`)));
      return { ...acc, bankPassbookUrls: newUrls };
    })) : [];

    const customer = await prisma.customer.create({
      data: {
        id: customerId,
        code: code,
        fullName: body.fullName || '',
        cardNumber: body.cardNumber || null,
        dob: body.dob ? new Date(body.dob) : new Date(),
        zairyuAddress: rawBody.address || body.zairyuAddress || '',
        zairyuRomajiAddress: rawBody.romajiAddress || body.zairyuRomajiAddress || '',
        zairyuFrontUrl,
        zairyuBackUrl,
        passportUrl,
        departureStampUrl,
        nenkinBookUrl,
        postalCode: body.postalCode || '',
        taxOfficeId: finalTaxOfficeId,
        createdById: user.id,

        // Additional fields
        nenkinNumber: body.nenkinNumber || null,
        nenkinKatakanaName: body.nenkinKatakanaName || null,
        zaloContact: body.zaloContact || null,
        facebookContact: body.facebookContact || null,
        referralCode: code,
        referredByCode: body.referredByCode || null,

        // 20 New fields
        lastName: body.lastName || null,
        firstName: body.firstName || null,
        fullNameFurigana: rawBody.fullNameFurigana || null,
        nationality: body.nationality || null,
        sex: body.sex || null,
        placeOfBirth: body.placeOfBirth || null,
        passportIssueDate: body.passportIssueDate ? new Date(body.passportIssueDate) : null,
        passportExpiryDate: body.passportExpiryDate ? new Date(body.passportExpiryDate) : null,
        phone: body.phone || null,
        overseasAddress: body.overseasAddress || null,
        overseasCountry: body.overseasCountry || null,
        hasPermanentResidence: body.hasPermanentResidence ?? null,
        permanentResidenceDate: body.permanentResidenceDate ? new Date(body.permanentResidenceDate) : null,
        myNumber: body.myNumber || null,
        headOfHouseholdName: body.headOfHouseholdName || null,
        relationshipToHead: body.relationshipToHead || null,
        bankAccounts: {
          create: bankAccounts.map((acc: any) => ({
            purpose: acc.purpose || 'BOTH',
            bankCountry: acc.bankCountry || 'JAPAN',
            bankPassbookUrls: acc.bankPassbookUrls || [],
            bankName: acc.bankName || null,
            branchName: acc.branchName || null,
            accountNumber: acc.accountNumber || null,
            accountName: acc.accountName || null,
            accountNameKatakana: acc.accountNameKatakana || null,
            swiftCode: acc.swiftCode || null,
            bankBranchAddress: acc.bankBranchAddress || null,
            bankInstitutionCode: acc.bankInstitutionCode || null,
            branchCode: acc.branchCode || null,
            bankAccountType: acc.bankAccountType || null
          }))
        }
      }
    });

    // Auto-save to BankDictionary if Vietnam bank
    if (body.bankAccounts) {
      for (const acc of body.bankAccounts) {
        if (acc.bankCountry === 'VIETNAM' && acc.bankName) {
          try {
            await prisma.bankDictionary.upsert({
              where: {
                country_bankName_branchName: {
                  country: 'VIETNAM',
                  bankName: acc.bankName,
                  branchName: acc.branchName || '',
                }
              },
              update: {
                swiftCode: acc.swiftCode,
                address: acc.bankBranchAddress,
              },
              create: {
                country: 'VIETNAM',
                bankName: acc.bankName,
                branchName: acc.branchName || '',
                swiftCode: acc.swiftCode,
                address: acc.bankBranchAddress,
              }
            });
          } catch (e) {}
        }
      }
    }

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create Customer Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    let whereClause = {};
    if (user.role === 'COLLABORATOR') {
      whereClause = { createdById: user.id };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { 
        taxOffice: true,
        applications: {
          select: { id: true },
          take: 1
        },
        bankAccounts: true
      }
    });
    
    const formattedCustomers = customers.map(c => {
      return {
        ...c,
        address: c.zairyuAddress,
        romajiAddress: c.zairyuRomajiAddress,
        applicationId: c.applications?.[0]?.id || null
      };
    });

    return NextResponse.json({ success: true, data: formattedCustomers });
  } catch (error: unknown) {
    console.error('Fetch Customers Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}


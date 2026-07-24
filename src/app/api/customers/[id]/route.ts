import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomerAccess } from '@/lib/auth/authorization';
import { customerSchema } from '@/lib/validations/customerSchema';
import { deleteStorageFile, moveStorageFile } from '@/lib/storageHelper';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, error } = await requireCustomerAccess(id);
    if (error || !user) return error;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        taxOffice: true,
        workHistories: { orderBy: { startDate: 'asc' } },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: {
            taxRepresentative: true
          }
        },
        bankAccounts: true
      }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: unknown) {
    console.error('Get Customer Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, error } = await requireCustomerAccess(id);
    if (error || !user) return error;

    const rawBody = await req.json();
    const body = customerSchema.partial().parse(rawBody);
    
    // Also extract status and workHistories from rawBody since they might not be in the base schema
    const status = rawBody.status;
    const workHistories = rawBody.workHistories;
    const taxOffice = rawBody.taxOffice;
    const bankAccounts = rawBody.bankAccounts;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { bankAccounts: true }
    });
    if (!existingCustomer) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    // Move any newly added document files to customerId, and delete old replaced files
    const docFields = ['zairyuFrontUrl', 'zairyuBackUrl', 'passportUrl', 'departureStampUrl', 'nenkinBookUrl'] as const;
    for (const field of docFields) {
      const newVal = body[field];
      const oldVal = existingCustomer[field];
      if (newVal !== undefined && newVal !== oldVal) {
        if (newVal) {
          const docType = field.replace('Url', '');
          body[field] = await moveStorageFile(newVal, id, docType);
        }
        if (oldVal && oldVal !== body[field]) {
          await deleteStorageFile(oldVal);
        }
      }
    }

    // Handle bank account passbooks moving/deletion
    if (bankAccounts && Array.isArray(bankAccounts)) {
      const newPassbookUrls = new Set<string>();
      
      for (let i = 0; i < bankAccounts.length; i++) {
        const acc = bankAccounts[i];
        if (acc.bankPassbookUrls && Array.isArray(acc.bankPassbookUrls)) {
          const processedUrls = await Promise.all(acc.bankPassbookUrls.map(async (url: string) => {
            if (url) {
              return await moveStorageFile(url, id, `bankPassbook_${i}`);
            }
            return url;
          }));
          acc.bankPassbookUrls = processedUrls;
          processedUrls.forEach(url => {
            if (url) newPassbookUrls.add(url);
          });
        }
      }

      // Gather old bank passbook urls
      const oldPassbookUrls = existingCustomer.bankAccounts.reduce((accUrl: string[], curr: any) => {
        if (curr.bankPassbookUrls && Array.isArray(curr.bankPassbookUrls)) {
          accUrl.push(...curr.bankPassbookUrls);
        }
        return accUrl;
      }, []);

      // Delete any old passbook URL that is not present in new list
      for (const oldUrl of oldPassbookUrls) {
        if (!newPassbookUrls.has(oldUrl)) {
          await deleteStorageFile(oldUrl);
        }
      }
    }

    let finalTaxOfficeId = body.taxOfficeId || null;
    if (!finalTaxOfficeId && taxOffice && taxOffice.name) {
      const existing = await prisma.taxOffice.findFirst({
        where: { name: taxOffice.name }
      });
      if (existing) {
        // Cập nhật các trường mới nếu có
        await prisma.taxOffice.update({
          where: { id: existing.id },
          data: {
            romajiName: taxOffice.romajiName !== undefined ? taxOffice.romajiName : existing.romajiName,
            address: taxOffice.address || existing.address,
            romajiAddress: taxOffice.romajiAddress !== undefined ? taxOffice.romajiAddress : existing.romajiAddress,
            postalCode: taxOffice.postalCode || existing.postalCode,
            phone: taxOffice.phone !== undefined ? taxOffice.phone : existing.phone,
            mailingName: taxOffice.mailingName !== undefined ? taxOffice.mailingName : existing.mailingName,
            mailingPostalCode: taxOffice.mailingPostalCode !== undefined ? taxOffice.mailingPostalCode : existing.mailingPostalCode,
            mailingAddress: taxOffice.mailingAddress !== undefined ? taxOffice.mailingAddress : existing.mailingAddress,
            jurisdiction: taxOffice.jurisdiction !== undefined ? taxOffice.jurisdiction : existing.jurisdiction,
            consultationPhone: taxOffice.consultationPhone !== undefined ? taxOffice.consultationPhone : existing.consultationPhone,
            generalPhone: taxOffice.generalPhone !== undefined ? taxOffice.generalPhone : existing.generalPhone,
          }
        });
        finalTaxOfficeId = existing.id;
      } else {
        const newOffice = await prisma.taxOffice.create({
          data: {
            name: taxOffice.name,
            romajiName: taxOffice.romajiName ?? null,
            address: taxOffice.address || '',
            romajiAddress: taxOffice.romajiAddress ?? null,
            postalCode: taxOffice.postalCode || '',
            phone: taxOffice.phone ?? null,
            mapUrl: taxOffice.mapUrl ?? null,
            websiteUrl: taxOffice.websiteUrl ?? null,
            mailingName: taxOffice.mailingName ?? null,
            mailingPostalCode: taxOffice.mailingPostalCode ?? null,
            mailingAddress: taxOffice.mailingAddress ?? null,
            jurisdiction: taxOffice.jurisdiction ?? null,
            consultationPhone: taxOffice.consultationPhone ?? null,
            generalPhone: taxOffice.generalPhone ?? null,
          }
        });
        finalTaxOfficeId = newOffice.id;
      }
    }

    const customer = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        fullName: body.fullName,
        cardNumber: body.cardNumber,
        dob: body.dob ? new Date(body.dob) : undefined,
        zairyuAddress: rawBody.address !== undefined ? rawBody.address : body.zairyuAddress,
        zairyuRomajiAddress: rawBody.romajiAddress !== undefined ? rawBody.romajiAddress : body.zairyuRomajiAddress,
        zairyuFrontUrl: body.zairyuFrontUrl,
        zairyuBackUrl: body.zairyuBackUrl,
        passportUrl: body.passportUrl,
        departureStampUrl: body.departureStampUrl,
        nenkinBookUrl: body.nenkinBookUrl,
        postalCode: body.postalCode,
        nenkinNumber: body.nenkinNumber,
        nenkinKatakanaName: body.nenkinKatakanaName,
        taxOfficeId: finalTaxOfficeId || undefined,

        lastName: body.lastName,
        firstName: body.firstName,
        fullNameFurigana: rawBody.fullNameFurigana,
        nationality: body.nationality,
        sex: body.sex,
        placeOfBirth: body.placeOfBirth,
        passportIssueDate: body.passportIssueDate ? new Date(body.passportIssueDate) : null,
        passportExpiryDate: body.passportExpiryDate ? new Date(body.passportExpiryDate) : null,
        phone: body.phone,
        overseasAddress: body.overseasAddress,
        overseasCountry: body.overseasCountry,
        hasPermanentResidence: body.hasPermanentResidence,
        permanentResidenceDate: body.permanentResidenceDate ? new Date(body.permanentResidenceDate) : null,
        myNumber: body.myNumber,
        occupation: body.occupation,
        departureDate: body.departureDate ? new Date(body.departureDate) : null,
        headOfHouseholdName: body.headOfHouseholdName,
        relationshipToHead: body.relationshipToHead,
        overseasStreet: rawBody.overseasStreet,
        overseasCity: rawBody.overseasCity,
        overseasProvince: rawBody.overseasProvince,
        overseasPostalCode: rawBody.overseasPostalCode,
      };

      if (status && status !== existingCustomer.status) {
        updateData.status = status;
      }

      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: updateData
      });

      if (status && status !== existingCustomer.status) {
        await tx.auditLog.create({
          data: {
            entityId: id,
            entityType: 'CUSTOMER',
            fromState: existingCustomer.status || 'NEW',
            toState: status,
            actionBy: user.id,
            metadata: {
              updatedKeys: Object.keys(rawBody)
            }
          }
        });
      }

      // Handle WorkHistories if provided
      if (workHistories && Array.isArray(workHistories)) {
        await tx.workHistory.deleteMany({ where: { customerId: id } });
        if (workHistories.length > 0) {
          await tx.workHistory.createMany({
            data: workHistories.map((wh: any) => ({
              customerId: id,
              companyName: wh.companyName || '',
              companyAddress: wh.companyAddress || '',
              startDate: wh.startDate ? new Date(wh.startDate) : null,
              endDate: wh.endDate ? new Date(wh.endDate) : null,
              pensionType: wh.pensionType || '厚生年金保険',
            }))
          });
        }
      }

      // Handle BankAccounts if provided
      if (bankAccounts && Array.isArray(bankAccounts)) {
        await tx.bankAccount.deleteMany({ where: { customerId: id } });
        if (bankAccounts.length > 0) {
          await tx.bankAccount.createMany({
            data: bankAccounts.map((acc: any) => ({
              customerId: id,
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
          });
        }
      }
      
      return updatedCustomer;
    });

    // Auto-save to BankDictionary if Vietnam bank
    if (bankAccounts && Array.isArray(bankAccounts)) {
      for (const acc of bankAccounts) {
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

    return NextResponse.json({ success: true, data: customer });
  } catch (error: unknown) {
    console.error('Update Customer Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, error } = await requireCustomerAccess(id);
    if (error || !user) return error;

    // Check if customer has applications
    const applicationsCount = await prisma.nenkinApplication.count({
      where: { customerId: id }
    });

    if (applicationsCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Không thể xóa khách hàng đã có hồ sơ đang xử lý. Hãy xóa hồ sơ trước.' 
      }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khách hàng thành công' });
  } catch (error: unknown) {
    console.error('Delete Customer Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

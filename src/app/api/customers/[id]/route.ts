import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomerAccess } from '@/lib/auth/authorization';

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
          take: 1,
          include: {
            taxRepresentative: true
          }
        }
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

    const body = await req.json();

    let finalTaxOfficeId = body.taxOfficeId || null;
    if (!finalTaxOfficeId && body.taxOffice && body.taxOffice.name) {
      const existing = await prisma.taxOffice.findFirst({
        where: { name: body.taxOffice.name }
      });
      if (existing) {
        // Cập nhật các trường mới nếu có
        await prisma.taxOffice.update({
          where: { id: existing.id },
          data: {
            romajiName: body.taxOffice.romajiName !== undefined ? body.taxOffice.romajiName : existing.romajiName,
            address: body.taxOffice.address || existing.address,
            romajiAddress: body.taxOffice.romajiAddress !== undefined ? body.taxOffice.romajiAddress : existing.romajiAddress,
            postalCode: body.taxOffice.postalCode || existing.postalCode,
            phone: body.taxOffice.phone !== undefined ? body.taxOffice.phone : existing.phone,
            mailingName: body.taxOffice.mailingName !== undefined ? body.taxOffice.mailingName : existing.mailingName,
            mailingPostalCode: body.taxOffice.mailingPostalCode !== undefined ? body.taxOffice.mailingPostalCode : existing.mailingPostalCode,
            mailingAddress: body.taxOffice.mailingAddress !== undefined ? body.taxOffice.mailingAddress : existing.mailingAddress,
            jurisdiction: body.taxOffice.jurisdiction !== undefined ? body.taxOffice.jurisdiction : existing.jurisdiction,
            consultationPhone: body.taxOffice.consultationPhone !== undefined ? body.taxOffice.consultationPhone : existing.consultationPhone,
            generalPhone: body.taxOffice.generalPhone !== undefined ? body.taxOffice.generalPhone : existing.generalPhone,
          }
        });
        finalTaxOfficeId = existing.id;
      } else {
        const newOffice = await prisma.taxOffice.create({
          data: {
            name: body.taxOffice.name,
            romajiName: body.taxOffice.romajiName ?? null,
            address: body.taxOffice.address || '',
            romajiAddress: body.taxOffice.romajiAddress ?? null,
            postalCode: body.taxOffice.postalCode || '',
            phone: body.taxOffice.phone ?? null,
            mapUrl: body.taxOffice.mapUrl ?? null,
            websiteUrl: body.taxOffice.websiteUrl ?? null,
            mailingName: body.taxOffice.mailingName ?? null,
            mailingPostalCode: body.taxOffice.mailingPostalCode ?? null,
            mailingAddress: body.taxOffice.mailingAddress ?? null,
            jurisdiction: body.taxOffice.jurisdiction ?? null,
            consultationPhone: body.taxOffice.consultationPhone ?? null,
            generalPhone: body.taxOffice.generalPhone ?? null,
          }
        });
        finalTaxOfficeId = newOffice.id;
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        fullName: body.fullName,
        cardNumber: body.cardNumber,
        dob: body.dob ? new Date(body.dob) : undefined,
        zairyuAddress: body.address !== undefined ? body.address : body.zairyuAddress,
        zairyuRomajiAddress: body.romajiAddress !== undefined ? body.romajiAddress : body.zairyuRomajiAddress,
        zairyuFrontUrl: body.zairyuFrontUrl,
        zairyuBackUrl: body.zairyuBackUrl,
        passportUrl: body.passportUrl,
        departureStampUrl: body.departureStampUrl,
        nenkinBookUrl: body.nenkinBookUrl,
        bankPassbookUrl: body.bankPassbookUrl,
        postalCode: body.postalCode,
        nenkinNumber: body.nenkinNumber,
        taxOfficeId: finalTaxOfficeId || undefined,

        bankName: body.bankName,
        branchName: body.branchName,
        accountNumber: body.accountNumber,
        accountName: body.accountName,
        swiftCode: body.swiftCode,

        lastName: body.lastName,
        firstName: body.firstName,
        fullNameFurigana: body.fullNameFurigana,
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
        bankBranchAddress: body.bankBranchAddress,
        bankBranchCity: body.bankBranchCity,
        accountNameKatakana: body.accountNameKatakana,
        bankCountry: body.bankCountry,
        occupation: body.occupation,
        departureDate: body.departureDate ? new Date(body.departureDate) : null,
        headOfHouseholdName: body.headOfHouseholdName,
        relationshipToHead: body.relationshipToHead,
        overseasStreet: body.overseasStreet,
        overseasCity: body.overseasCity,
        overseasProvince: body.overseasProvince,
        overseasPostalCode: body.overseasPostalCode,
      }
    });

    // Handle WorkHistories if provided
    if (body.workHistories && Array.isArray(body.workHistories)) {
      // Delete existing
      await prisma.workHistory.deleteMany({ where: { customerId: id } });
      // Insert new
      if (body.workHistories.length > 0) {
        await prisma.workHistory.createMany({
          data: body.workHistories.map((wh: any) => ({
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

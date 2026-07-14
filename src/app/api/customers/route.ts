import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const body = await req.json();
    
    // Auto-generate code
    const count = await prisma.customer.count();
    const code = `KH${(count + 1).toString().padStart(3, '0')}`;

    let finalTaxOfficeId = body.taxOfficeId || null;
    if (!finalTaxOfficeId && body.taxOffice && body.taxOffice.name) {
      const existing = await prisma.taxOffice.findFirst({
        where: { name: body.taxOffice.name }
      });
      if (existing) {
        finalTaxOfficeId = existing.id;
      } else {
        const newOffice = await prisma.taxOffice.create({
          data: {
            name: body.taxOffice.name,
            romajiName: body.taxOffice.romajiName,
            address: body.taxOffice.address || '',
            romajiAddress: body.taxOffice.romajiAddress,
            postalCode: body.taxOffice.postalCode || '',
            phone: body.taxOffice.phone,
            mapUrl: body.taxOffice.mapUrl,
            websiteUrl: body.taxOffice.websiteUrl,
          }
        });
        finalTaxOfficeId = newOffice.id;
      }
    }

    const customer = await prisma.customer.create({
      data: {
        code: code,
        fullName: body.fullName || '',
        cardNumber: body.cardNumber || null,
        dob: body.dob ? new Date(body.dob) : new Date(),
        zairyuAddress: body.address || '',
        zairyuRomajiAddress: body.romajiAddress || '',
        zairyuFrontUrl: body.zairyuFrontUrl || '',
        zairyuBackUrl: body.zairyuBackUrl || '',
        passportUrl: body.passportUrl || '',
        departureStampUrl: body.departureStampUrl || '',
        nenkinBookUrl: body.nenkinBookUrl || '',
        bankPassbookUrl: body.bankPassbookUrl || '',
        postalCode: body.postalCode || '',
        taxOfficeId: finalTaxOfficeId,
        createdById: user.id,

        // Additional fields
        nenkinNumber: body.nenkinNumber || null,
        bankName: body.bankName || null,
        branchName: body.branchName || null,
        accountNumber: body.accountNumber || null,
        accountName: body.accountName || null,
        swiftCode: body.swiftCode || null,

        // 20 New fields
        lastName: body.lastName || null,
        firstName: body.firstName || null,
        fullNameFurigana: body.fullNameFurigana || null,
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
        bankBranchAddress: body.bankBranchAddress || null,
        bankCountry: body.bankCountry || null,
        occupation: body.occupation || null,
        departureDate: body.departureDate ? new Date(body.departureDate) : null,
        headOfHouseholdName: body.headOfHouseholdName || null,
        relationshipToHead: body.relationshipToHead || null
      }
    });

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
        }
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


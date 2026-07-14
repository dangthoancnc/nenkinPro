import { requireCustomerAccess } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {

    const { customerId, templateName } = await req.json();

    const { user, error } = await requireCustomerAccess(customerId);
    if (error || !user) return error;

    if (!customerId || !templateName) {
      return NextResponse.json({ error: 'Missing customerId or templateName' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { taxOffice: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (user.role === 'COLLABORATOR' && customer.createdById !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const safeTemplateName = path.basename(templateName);
    const templatePath = path.join(process.cwd(), 'public', 'templates', safeTemplateName);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template not found` }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // Mapping all database fields to docxtemplater tags
    const data = {
      // Basic Info
      fullName: customer.fullName || '',
      fullNameFurigana: customer.fullNameFurigana || '',
      dob: customer.dob ? customer.dob.toISOString().split('T')[0] : '',
      sex: customer.sex || '',
      nationality: customer.nationality || '',
      phone: customer.phone || '',
      myNumber: customer.myNumber || '',
      occupation: customer.occupation || '',
      
      // Passport Info
      lastName: customer.lastName || '',
      firstName: customer.firstName || '',
      passportNumber: customer.cardNumber || '', // Optional fallback
      passportIssueDate: customer.passportIssueDate ? customer.passportIssueDate.toISOString().split('T')[0] : '',
      passportExpiryDate: customer.passportExpiryDate ? customer.passportExpiryDate.toISOString().split('T')[0] : '',
      placeOfBirth: customer.placeOfBirth || '',
      
      // Zairyu & Japan Residence
      zairyuAddress: customer.zairyuAddress || '',
      zairyuRomajiAddress: customer.zairyuRomajiAddress || '',
      postalCode: customer.postalCode || '',
      hasPermanentResidence: customer.hasPermanentResidence ? 'Có' : 'Không',
      permanentResidenceDate: customer.permanentResidenceDate ? customer.permanentResidenceDate.toISOString().split('T')[0] : '',
      
      // Departure & Overseas Info
      departureDate: customer.departureDate ? customer.departureDate.toISOString().split('T')[0] : '',
      overseasAddress: customer.overseasAddress || '',
      overseasCountry: customer.overseasCountry || '',
      
      // Family Info
      headOfHouseholdName: customer.headOfHouseholdName || '',
      relationshipToHead: customer.relationshipToHead || '',
      
      // Nenkin Info
      nenkinNumber: customer.nenkinNumber || '',
      
      // Tax Office Info
      taxOfficeName: customer.taxOffice?.name || '',
      taxOfficeRomajiName: customer.taxOffice?.romajiName || '',
      taxOfficeAddress: customer.taxOffice?.address || '',
      taxOfficeRomajiAddress: customer.taxOffice?.romajiAddress || '',
      taxOfficePostalCode: customer.taxOffice?.postalCode || '',
      taxOfficePhone: customer.taxOffice?.phone || '',
      
      // Bank Info
      bankName: customer.bankName || '',
      branchName: customer.branchName || '',
      accountNumber: customer.accountNumber || '',
      accountName: customer.accountName || '',
      swiftCode: customer.swiftCode || '',
      bankBranchAddress: customer.bankBranchAddress || '',
      bankCountry: customer.bankCountry || '',
      
      // Backward compatibility with previous AI assumptions
      customerName: customer.fullName || '',
      customerFurigana: customer.fullNameFurigana || '',
      customerDob: customer.dob ? customer.dob.toISOString().split('T')[0] : '',
      customerAddress: customer.zairyuAddress || '',
      customerRomajiAddress: customer.zairyuRomajiAddress || '',
      customerNenkin: customer.nenkinNumber || '',
    };

    // --- DATA SHREDDER (Băm dữ liệu thành từng ký tự cho các ô vuông trên Form Word) ---
    const shreddedData: Record<string, unknown> = { ...data };

    // 1. Shred DOB (YYYY-MM-DD) -> dobY1, dobY2, dobM1, dobD1...
    if (customer.dob) {
      const dStr = customer.dob.toISOString().split('T')[0]; // "1993-08-15"
      const [year, month, day] = dStr.split('-');
      if (year && year.length === 4) {
        year.split('').forEach((char, i) => shreddedData[`dobY${i + 1}`] = char);
      }
      if (month && month.length === 2) {
        month.split('').forEach((char, i) => shreddedData[`dobM${i + 1}`] = char);
      }
      if (day && day.length === 2) {
        day.split('').forEach((char, i) => shreddedData[`dobD${i + 1}`] = char);
      }
    }

    // 2. Shred Nenkin Number (remove hyphens) -> nk1, nk2...
    if (customer.nenkinNumber) {
      const nkClean = customer.nenkinNumber.replace(/\D/g, ''); // Keep only digits
      nkClean.split('').forEach((char, i) => shreddedData[`nk${i + 1}`] = char);
    }

    // 3. Shred Account Number -> acc1, acc2...
    if (customer.accountNumber) {
      const accClean = customer.accountNumber.replace(/\D/g, '');
      accClean.split('').forEach((char, i) => shreddedData[`acc${i + 1}`] = char);
    }

    // 4. Shred Postal Code -> zip1, zip2... (e.g. 123-4567)
    if (customer.postalCode) {
      const zipClean = customer.postalCode.replace(/\D/g, '');
      zipClean.split('').forEach((char, i) => shreddedData[`zip${i + 1}`] = char);
    }

    doc.render(shreddedData);
    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    const encodedFilename = encodeURIComponent(`Generated_${safeTemplateName}`);

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


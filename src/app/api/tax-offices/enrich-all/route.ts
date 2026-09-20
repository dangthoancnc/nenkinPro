import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchNtaTaxOfficeByZip } from '@/lib/ntaHelper';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const allOffices = await prisma.taxOffice.findMany();
    let updatedCount = 0;

    for (const office of allOffices) {
      let cleanZip = office.postalCode.replace(/[-\s]/g, '');
      let formattedZip = cleanZip.length === 7 ? `${cleanZip.slice(0, 3)}-${cleanZip.slice(3)}` : office.postalCode;

      let mapUrl = office.mapUrl;
      if (!mapUrl || mapUrl.trim() === '') {
        mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.name + ' ' + office.address)}`;
      }

      let receptionInfo = office.receptionInfo || '8:30 - 17:00 (Thứ 2 đến Thứ 6, trừ ngày lễ)';

      let ntaData = null;
      try {
        if (cleanZip.length === 7) {
          ntaData = await fetchNtaTaxOfficeByZip(cleanZip);
        }
      } catch (e) {
        console.warn(`Enrich NTA error for zip ${cleanZip}:`, e);
      }

      let websiteUrl = office.websiteUrl || ntaData?.ntaPageUrl || null;
      let mailingName = office.mailingName || ntaData?.mailingName || office.name;
      let mailingPostalCode = office.mailingPostalCode || ntaData?.mailingPostalCode || formattedZip;
      let mailingAddress = office.mailingAddress || ntaData?.mailingAddress || office.address;
      let jurisdiction = office.jurisdiction || ntaData?.jurisdiction || null;
      let consultationPhone = office.consultationPhone || ntaData?.consultationPhone || office.phone;
      let generalPhone = office.generalPhone || ntaData?.generalPhone || office.phone;
      let romajiName = office.romajiName;
      if (!romajiName) {
        if (office.name.includes('堺西')) romajiName = 'Sakainishi Tax Office';
        else if (office.name.includes('堺')) romajiName = 'Sakai Tax Office';
        else if (office.name.includes('今治')) romajiName = 'Imabari Tax Office';
        else if (office.name.includes('半田')) romajiName = 'Handa Tax Office';
        else if (office.name.includes('八女')) romajiName = 'Yame Tax Office';
        else romajiName = office.name.replace(/税務署$/, '') + ' Tax Office';
      }

      await prisma.taxOffice.update({
        where: { id: office.id },
        data: {
          postalCode: formattedZip,
          mapUrl,
          websiteUrl,
          receptionInfo,
          mailingName,
          mailingPostalCode,
          mailingAddress,
          jurisdiction,
          consultationPhone,
          generalPhone,
          romajiName,
        }
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Đã chuẩn hóa và làm giàu dữ liệu cho ${updatedCount} cục thuế!`,
      count: updatedCount,
    });
  } catch (err: any) {
    console.error('Enrich all tax offices error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

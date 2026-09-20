import prisma from '../src/lib/prisma';
import { fetchNtaTaxOfficeByZip } from '../src/lib/ntaHelper';

async function main() {
  console.log('=== STARTING TAX OFFICES CLEANUP & ENRICHMENT ===');

  // 1. Tìm cục thuế chuẩn 堺西税務署
  const sakainishi = await prisma.taxOffice.findFirst({
    where: { name: '堺西税務署' }
  });

  if (!sakainishi) {
    console.error('Không tìm thấy 堺西税務署 trong DB!');
    return;
  }

  // 2. Chuyển khách hàng KH004 (Lò Thị Hiền) sang 堺西税務署
  const kh004 = await prisma.customer.findFirst({
    where: { code: 'KH004' }
  });
  if (kh004) {
    await prisma.customer.update({
      where: { id: kh004.id },
      data: { taxOfficeId: sakainishi.id }
    });
    console.log(`✓ Đã chuyển khách hàng KH004 (${kh004.fullName}) sang 堺西税務署 (${sakainishi.postalCode})`);
  }

  // 3. Xóa bản ghi rác 西税務署 (nếu có)
  const junkOffices = await prisma.taxOffice.findMany({
    where: {
      OR: [
        { name: '西税務署' },
        { postalCode: '5928332' }
      ]
    }
  });

  for (const junk of junkOffices) {
    // Kiểm tra có khách hàng nào đang trỏ vào không
    const count = await prisma.customer.count({ where: { taxOfficeId: junk.id } });
    if (count === 0) {
      await prisma.taxOffice.delete({ where: { id: junk.id } });
      console.log(`✓ Đã xóa bản ghi rác: ${junk.name} (〒${junk.postalCode})`);
    } else {
      console.log(`⚠️ Không thể xóa ${junk.name} vì vẫn còn ${count} khách hàng.`);
    }
  }

  // 4. Chuẩn hóa & Làm giàu dữ liệu cho tất cả các Cục thuế còn lại
  const allOffices = await prisma.taxOffice.findMany();
  console.log(`Đang làm giàu dữ liệu cho ${allOffices.length} cục thuế...`);

  for (const office of allOffices) {
    let cleanZip = office.postalCode.replace(/[-\s]/g, '');
    let formattedZip = cleanZip.length === 7 ? `${cleanZip.slice(0, 3)}-${cleanZip.slice(3)}` : office.postalCode;

    // Sinh Google Maps URL chuẩn nếu chưa có
    let mapUrl = office.mapUrl;
    if (!mapUrl || mapUrl.trim() === '') {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.name + ' ' + office.address)}`;
    }

    // Giờ tiếp nhận chuẩn
    let receptionInfo = office.receptionInfo || '8:30 - 17:00 (Thứ 2 đến Thứ 6, trừ ngày lễ)';

    // Thử tra cứu NTA để lấy thêm dữ liệu (websiteUrl, mailing address, etc.)
    let ntaData = null;
    try {
      if (cleanZip.length === 7) {
        ntaData = await fetchNtaTaxOfficeByZip(cleanZip);
      }
    } catch (e) {
      console.warn(`Không thể tra NTA cho zip ${cleanZip}:`, e);
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

    console.log(`✓ Đã làm giàu dữ liệu cho: ${office.name} (〒${formattedZip})`);
  }

  console.log('=== HOÀN TẤT DỌN DẸP & LÀM GIÀU CỤC THUẾ ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  const { searchParams } = new URL(request.url);
  let zip = searchParams.get('zip') || '';
  zip = zip.replace(/[-\s]/g, '');

  if (zip.length !== 7) {
    return NextResponse.json({ success: false, error: 'Mã bưu điện không hợp lệ (phải có 7 chữ số).' }, { status: 400 });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('KSTYPE', 'ksz');
    formData.append('kszc1', zip.substring(0, 3));
    formData.append('kszc2', zip.substring(3, 7));

    const res = await fetch('https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`NTA responded with status: ${res.status}`);
    }

    const rawHtml = await res.text();
    let ntaHtmlContext = '';

    let detailUrl = '';
    const ksrstMatch = rawHtml.match(/<div id="ksrst"[^>]*>([\s\S]*?)<\/div>/);
    if (ksrstMatch) {
      const ksrstHtml = ksrstMatch[1];
      const linkMatch = ksrstHtml.match(/href=['"]([^'"]+?index\.html?)['"]/i);
      if (linkMatch) {
        const relPath = linkMatch[1];
        detailUrl = new URL(relPath, 'https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php').href;
        const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(10000) });
        if (detailRes.ok) {
          const buffer = await detailRes.arrayBuffer();
          const decoder = new TextDecoder('shift_jis');
          ntaHtmlContext = decoder.decode(buffer);
        }
      }
    }

    if (!ntaHtmlContext) {
      const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      ntaHtmlContext = bodyMatch ? bodyMatch[1] : rawHtml;
    }

    // Direct Parsing without AI (Faster, 0 Quota)
    const parsed = {
      name: '',
      romajiName: '',
      address: '',
      postalCode: '',
      phone: '',
      mailingName: '',
      mailingRecipientName: '御中',
      mailingPostalCode: '',
      mailingAddress: '',
      jurisdiction: '',
      consultationPhone: '',
      generalPhone: '',
      notes: '',
      ntaPageUrl: detailUrl || 'https://www.nta.go.jp/about/organization/access/map.htm'
    };

    const nameMatch = ntaHtmlContext.match(/<div class="page-header"[^>]*>\s*<h1>(.*?)<\/h1>/);
    if (nameMatch) parsed.name = nameMatch[1].trim();

    const locMatch = ntaHtmlContext.match(/<h2>所在地など<\/h2>[\s\S]*?<li>所在地<br>\s*〒([\d-]+)<br>\s*([^<]+)<\/li>/);
    if (locMatch) {
      parsed.postalCode = locMatch[1].trim();
      parsed.address = locMatch[2].trim().replace(/\s+/g, ' ');
    }

    const jurMatch = ntaHtmlContext.match(/<li>管轄区域<br>\s*([^<]+)<\/li>/);
    if (jurMatch) parsed.jurisdiction = jurMatch[1].trim();

    const mailMatch = ntaHtmlContext.match(/<h2>申告書等の郵送先<\/h2>[\s\S]*?〒([\d-]+)<br>\s*([^<]+)<br>\s*([^<]+)<br>/);
    if (mailMatch) {
      parsed.mailingPostalCode = mailMatch[1].trim();
      parsed.mailingAddress = mailMatch[2].trim().replace(/\s+/g, ' ');
      parsed.mailingName = mailMatch[3].trim();
    } else {
      parsed.mailingPostalCode = parsed.postalCode;
      parsed.mailingAddress = parsed.address;
      parsed.mailingName = parsed.name;
    }

    const genPhoneMatch = ntaHtmlContext.match(/<h2>電話相談以外で税務署にご用の方<\/h2>[\s\S]*?<a href="tel:([^"]+)">/);
    if (genPhoneMatch) {
      parsed.generalPhone = genPhoneMatch[1].trim();
      parsed.phone = parsed.generalPhone; 
    }

    const consPhoneMatch = ntaHtmlContext.match(/<h2>電話相談の方<\/h2>[\s\S]*?<a href="tel:([^"]+)">/);
    if (consPhoneMatch) {
      parsed.consultationPhone = consPhoneMatch[1].trim();
    }

    if (!parsed.phone) {
       // Fallback to any phone in the page
       const anyPhoneMatch = ntaHtmlContext.match(/<a href="tel:([^"]+)">/);
       if (anyPhoneMatch) parsed.phone = anyPhoneMatch[1].trim();
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (error: any) {
    console.error('NTA Lookup Error:', error);
    try {
      const fs = require('fs');
      fs.writeFileSync('d:/AntiGravity_Workspace/apps/nenkin/scratch/nta_lookup_error.txt', error.stack || error.message || String(error));
    } catch (e) {
      // ignore
    }
    let errorMsg = error.message || 'Lỗi tra cứu Cục thuế';
    let status = 500;
    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota exceeded') || errorMsg.toLowerCase().includes('limit')) {
      errorMsg = 'Hạn ngạch (Quota) tra cứu bằng AI tạm thời bị quá tải (429). Vui lòng đợi khoảng 20-30 giây để hệ thống tự thiết lập lại rồi nhấn thử lại!';
      status = 429;
    }
    return NextResponse.json({ success: false, error: errorMsg }, { status });
  }
}

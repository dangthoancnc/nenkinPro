import { requireStaff } from '@/lib/auth/authorization';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');
  const address = searchParams.get('address');

  try {
    // 1. Lookup address from postal code
    if (zip) {
      const cleanZip = zip.replace(/[-\s]/g, '');
      if (cleanZip.length !== 7 || !/^\d{7}$/.test(cleanZip)) {
        return NextResponse.json({ success: false, error: 'Mã bưu điện phải gồm đúng 7 chữ số (ví dụ: 592-8335 hoặc 5928335).' }, { status: 400 });
      }

      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanZip}`, {
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return NextResponse.json({ success: false, error: 'Lỗi kết nối đến dịch vụ bưu chính Nhật Bản.' }, { status: 502 });
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return NextResponse.json({ success: false, error: `Không tìm thấy địa chỉ cho mã bưu điện 〒${cleanZip.slice(0, 3)}-${cleanZip.slice(3)}.` }, { status: 404 });
      }

      const item = data.results[0];
      const prefecture = item.address1 || '';
      const city = item.address2 || '';
      const town = item.address3 || '';
      const fullAddress = `${prefecture}${city}${town}`.trim();
      const kana = `${item.kana1 || ''} ${item.kana2 || ''} ${item.kana3 || ''}`.trim();

      return NextResponse.json({
        success: true,
        data: {
          postalCode: `${cleanZip.slice(0, 3)}-${cleanZip.slice(3)}`,
          cleanPostalCode: cleanZip,
          prefecture,
          city,
          town,
          fullAddress,
          kana,
          results: data.results,
        },
      });
    }

    // 2. Lookup postal code from address
    if (address) {
      const cleanAddress = address.trim();
      if (!cleanAddress) {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập địa chỉ cần tra cứu.' }, { status: 400 });
      }

      // Priority 1: excelapi
      try {
        const excelUrl = `https://api.excelapi.org/post/zipcode?address=${encodeURIComponent(cleanAddress)}`;
        const excelRes = await fetch(excelUrl, { signal: AbortSignal.timeout(6000) });
        if (excelRes.ok) {
          const rawText = (await excelRes.text()).trim().replace(/[-\s]/g, '');
          if (/^\d{7}$/.test(rawText)) {
            const formatted = `${rawText.slice(0, 3)}-${rawText.slice(3)}`;
            return NextResponse.json({
              success: true,
              data: {
                postalCode: formatted,
                cleanPostalCode: rawText,
                source: 'excelapi',
              },
            });
          }
        }
      } catch (err) {
        console.error('excelapi error:', err);
      }

      // Priority 2: Nominatim OpenStreetMap fallback
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanAddress)}&format=json&addressdetails=1&countrycodes=jp&limit=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'NenkinPro/1.0 (postal-lookup)',
            'Accept-Language': 'ja',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const places = await res.json();
          if (places && places.length > 0 && places[0].address?.postcode) {
            const rawPostcode = places[0].address.postcode.replace(/[-\s]/g, '');
            if (/^\d{7}$/.test(rawPostcode)) {
              return NextResponse.json({
                success: true,
                data: {
                  postalCode: `${rawPostcode.slice(0, 3)}-${rawPostcode.slice(3)}`,
                  cleanPostalCode: rawPostcode,
                  source: 'nominatim',
                },
              });
            }
          }
        }
      } catch (err) {
        console.error('nominatim error:', err);
      }

      return NextResponse.json({
        success: false,
        error: 'Không tìm thấy mã bưu điện cho địa chỉ này. Hãy nhập chi tiết hơn (gồm Tỉnh và Thành phố/Quận).',
      }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: 'Thiếu tham số tra cứu (cần zip hoặc address).' }, { status: 400 });
  } catch (err: any) {
    console.error('Postal lookup route error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tra cứu bưu chính' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/authorization';

export async function GET(request: Request) {
  const { user, error } = await requireRole(['ADMIN']);
  if (error || !user) return error;

  const { searchParams } = new URL(request.url);
  let zip = searchParams.get('zip') || '';
  zip = zip.replace(/[-\s]/g, '');

  if (zip.length !== 7) {
    return NextResponse.json({ error: 'Invalid zip code' }, { status: 400 });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('KSTYPE', 'ksz');
    formData.append('kszc1', zip.substring(0, 3));
    formData.append('kszc2', zip.substring(3, 7));

    const res = await fetch('https://www.nta.go.jp/cgi-bin/zeimusho/kensaku/kensakuprocess.php', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      // Using abort signal to avoid hanging
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`NTA responded with status: ${res.status}`);
    }

    const html = await res.text();
    
    // Consultation phone
    const consultMatch = html.match(/<span[^>]*>([0-9]{4}-[0-9]{2}-[0-9]{4})<\/span>/);
    const consultationPhone = consultMatch ? consultMatch[1] : '';

    // General phone
    const generalMatch = html.match(/代表&nbsp;([0-9\-]+)/);
    const generalPhone = generalMatch ? generalMatch[1] : '';

    return NextResponse.json({
      consultationPhone,
      generalPhone
    });
  } catch (error: any) {
    console.error('Error scraping NTA:', error);
    return NextResponse.json({ error: 'Failed to fetch from NTA', details: error.message }, { status: 500 });
  }
}

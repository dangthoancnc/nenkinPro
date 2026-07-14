import { validateEmployee } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';

export async function GET() {
  const employee = await validateEmployee();
  if (!employee) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };

    // 1. Get homepage to get CSRF token and cookies
    const res1 = await fetch('https://sendmoney.co.jp/', { headers, cache: 'no-store' });
    const html = await res1.text();
    const cookiesRaw = res1.headers.get('set-cookie');
    
    // Node fetch get('set-cookie') returns comma separated, grab the first part of each cookie
    const cookies = cookiesRaw ? cookiesRaw.split(',').map(c => c.split(';')[0]).join('; ') : '';
    
    const csrfMatch = html.match(/<meta name="csrf-token" content="([^"]+)">/);
    if (!csrfMatch) {
      return NextResponse.json({ error: 'No CSRF token found' }, { status: 500 });
    }
    const csrf = csrfMatch[1];

    // 2. Post to /getFx
    const res2 = await fetch('https://sendmoney.co.jp/getFx', {
      method: 'POST',
      headers: {
        ...headers,
        'X-CSRF-TOKEN': csrf,
        'Cookie': cookies,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://sendmoney.co.jp',
        'Referer': 'https://sendmoney.co.jp/'
      },
      cache: 'no-store'
    });
    const json = await res2.json();
    
    let rate = null;
    let updatedAt = null;

    if (json.JPYVND) {
      rate = parseFloat(json.JPYVND.rate);
      updatedAt = json.JPYVND.time;
    } else {
      // Fallback in case the structure changes
      for (const key in json) {
        if (json[key].unit === 'VND') {
          rate = parseFloat(json[key].rate);
          updatedAt = json[key].time;
          break;
        }
      }
    }

    if (!rate) {
       return NextResponse.json({ error: 'VND Rate not found in response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rate: rate,
      updatedAt: updatedAt
    });

  } catch (error) {
    console.error('Exchange Rate Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function fetchVcbRate() {
  try {
    const res = await fetch('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx', { cache: 'no-store' });
    const text = await res.text();
    const match = text.match(/<Exrate CurrencyCode="JPY" .*?Transfer="([\d,.]+)"/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  } catch (e) {
    console.error('Error fetching VCB rate:', e);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    // Auto-fetch logic for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRate = await prisma.exchangeRate.findFirst({
      where: {
        date: {
          gte: today,
        }
      }
    });

    if (!todayRate) {
      const vcbRate = await fetchVcbRate();
      if (vcbRate) {
        // We use upsert to avoid race conditions
        const now = new Date();
        await prisma.exchangeRate.upsert({
          where: { date: new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z') }, // normalize to date only
          update: { jpyToVnd: vcbRate },
          create: { date: new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z'), jpyToVnd: vcbRate },
        });
      }
    }

    const rates = await prisma.exchangeRate.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, data: rates.reverse() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, jpyToVnd } = body;

    const rate = await prisma.exchangeRate.upsert({
      where: { date: new Date(date) },
      update: { jpyToVnd },
      create: { date: new Date(date), jpyToVnd },
    });

    return NextResponse.json({ success: true, data: rate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to update rate' }, { status: 500 });
  }
}

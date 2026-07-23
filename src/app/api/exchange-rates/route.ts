import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function fetchDcomRate(): Promise<{ rate: number; updateTime: string } | null> {
  try {
    const res = await fetch('https://sendmoney.co.jp/vi/fx-rate', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const timeMatch = html.match(/Cập nhật lúc:\s*([\d-]+\s+[\d:]+)/i);
    const updateTime = timeMatch ? timeMatch[1].trim() : new Date().toISOString();

    const vndMatch = html.match(/Viet Nam Dong\s*\(VND\)[\s\S]*?VND\s*([\d,.]+)/i);
    if (vndMatch) {
      const rate = parseFloat(vndMatch[1].replace(/,/g, ''));
      if (!isNaN(rate) && rate > 0) {
        return { rate, updateTime };
      }
    }
  } catch (e) {
    console.error('Error fetching DCOM rate:', e);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Auto-fetch DCOM real-time rate
    const dcomResult = await fetchDcomRate();
    const liveRate = dcomResult?.rate || null;
    const liveTime = dcomResult?.updateTime || null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDateKey = new Date(today.toISOString().split('T')[0] + 'T00:00:00.000Z');

    if (liveRate && (forceRefresh || !(await prisma.exchangeRate.findFirst({ where: { date: { gte: today } } })))) {
      await prisma.exchangeRate.upsert({
        where: { date: todayDateKey },
        update: { jpyToVnd: liveRate },
        create: { date: todayDateKey, jpyToVnd: liveRate },
      });
    }

    const rates = await prisma.exchangeRate.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });

    const formattedRates = rates.reverse();
    const latestRateVal = liveRate || (formattedRates.length > 0 ? Number(formattedRates[formattedRates.length - 1].jpyToVnd) : 161.0);

    return NextResponse.json({
      success: true,
      source: 'DCOM Money Express',
      currentDcomRate: latestRateVal,
      lastUpdatedTime: liveTime,
      data: formattedRates
    });
  } catch (error) {
    console.error('Error in exchange-rates API:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, jpyToVnd } = body;

    const rate = await prisma.exchangeRate.upsert({
      where: { date: new Date(date) },
      update: { jpyToVnd: parseFloat(jpyToVnd) },
      create: { date: new Date(date), jpyToVnd: parseFloat(jpyToVnd) },
    });

    return NextResponse.json({ success: true, data: rate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to update rate' }, { status: 500 });
  }
}

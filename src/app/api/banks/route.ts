import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const country = searchParams.get('country') || 'VIETNAM';

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const banks = await prisma.bankDictionary.findMany({
      where: {
        country,
        OR: [
          { bankName: { contains: query, mode: 'insensitive' } },
          { branchName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
    });

    return NextResponse.json({ success: true, data: banks });
  } catch (error: any) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

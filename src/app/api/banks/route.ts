import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();
    const country = searchParams.get('country') || 'VIETNAM';

    let whereClause: any = { country };
    if (query) {
      whereClause = {
        country,
        OR: [
          { bankName: { contains: query, mode: 'insensitive' } },
          { branchName: { contains: query, mode: 'insensitive' } },
          { swiftCode: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ]
      };
    }

    const banks = await prisma.bankDictionary.findMany({
      where: whereClause,
      take: 30,
      orderBy: { bankName: 'asc' },
    });

    return NextResponse.json({ success: true, data: banks });
  } catch (error: any) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bankName, branchName, swiftCode, country = 'VIETNAM', address, city } = body;

    if (!bankName) {
      return NextResponse.json({ success: false, error: 'bankName is required' }, { status: 400 });
    }

    const bank = await prisma.bankDictionary.upsert({
      where: {
        country_bankName_branchName: {
          country,
          bankName,
          branchName: branchName || '',
        }
      },
      update: {
        swiftCode: swiftCode ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,
      },
      create: {
        country,
        bankName,
        branchName: branchName || '',
        swiftCode: swiftCode ?? null,
        address: address ?? null,
        city: city ?? null,
      }
    });

    return NextResponse.json({ success: true, data: bank });
  } catch (error: any) {
    console.error('Error creating/updating bank:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

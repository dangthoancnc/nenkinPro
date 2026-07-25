import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const faqs = await (prisma as any).faqItem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: faqs,
    });
  } catch (err: any) {
    console.error('Fetch public FAQs error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

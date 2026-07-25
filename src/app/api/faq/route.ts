import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let faqs: any[] = [];

    // Safely check if Prisma model exists on running singleton
    if ((prisma as any).faqItem) {
      faqs = await (prisma as any).faqItem.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
    } else {
      // HMR Singleton Fallback via Raw SQL
      faqs = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.nenkin_faq_items WHERE "isActive" = true ORDER BY "order" ASC`
      );
    }

    return NextResponse.json({
      success: true,
      data: faqs,
    });
  } catch (err: any) {
    console.error('Fetch public FAQs error:', err);
    return NextResponse.json({ success: true, data: [] });
  }
}

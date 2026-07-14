import { requireCustomerAccess } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, error } = await requireCustomerAccess(id);
    if (error || !user) return error;

    const ocrResults = await prisma.ocrResult.findMany({
      where: { customerId: id },
    });

    // Chuyển đổi thành dạng dễ tra cứu: { 'zairyuFront': { ... }, 'passport': { ... } }
    const cachedOcrData: Record<string, any> = {};
    for (const result of ocrResults) {
      cachedOcrData[result.documentType] = result.rawData;
    }

    return NextResponse.json({ success: true, data: cachedOcrData });
  } catch (error) {
    console.error('Fetch OCR Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

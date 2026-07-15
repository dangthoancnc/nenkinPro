import { NextResponse } from 'next/server';
import { requireCustomerSession } from '@/lib/auth/requireCustomerSession';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Customer } from '@prisma/client';

const ALLOWED_DOC_TYPES: Record<string, keyof Customer> = {
  zairyuFront:    'zairyuFrontUrl',
  zairyuBack:     'zairyuBackUrl',
  passport:       'passportUrl',
  departureStamp: 'departureStampUrl',
  nenkinBook:     'nenkinBookUrl',
  bankPassbook:   'bankPassbookUrl',
  securityPhoto:  'securityPhotoUrl',
} as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ documentType: string }> }
) {
  try {
    const { documentType } = await params;

    // 1. Validate whitelist
    const columnField = ALLOWED_DOC_TYPES[documentType];
    if (!columnField) {
      return NextResponse.json({ success: false, error: 'Invalid document type' }, { status: 400 });
    }

    // 2. Auth check
    let session;
    try {
      const authResult = await requireCustomerSession();
      session = authResult.session;
    } catch (e: any) {
      if (e.message === '403_PIN_RESET_REQUIRED') {
        return NextResponse.json({ success: false, error: 'PIN Reset Required', requireReset: true }, { status: 403 });
      }
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Fetch URL from DB
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { [columnField]: true }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const fullUrl = customer[columnField];
    if (typeof fullUrl !== 'string' || !fullUrl) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    if (!fullUrl.includes('/storage/v1/object/public/')) {
      console.error('Unexpected URL format:', fullUrl);
      return NextResponse.json({ success: false, error: 'Invalid document URL format' }, { status: 500 });
    }
    
    const urlParts = fullUrl.split('/storage/v1/object/public/')[1];
    const slashIndex = urlParts.indexOf('/');
    
    if (slashIndex === -1) {
      return NextResponse.json({ success: false, error: 'Invalid document URL format' }, { status: 500 });
    }
    
    const bucket = urlParts.substring(0, slashIndex);
    const filePath = urlParts.substring(slashIndex + 1);

    // 5. Generate Signed URL (900 seconds = 15 mins)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, 900);

    if (error || !data) {
      console.error('Create signed URL error:', error);
      return NextResponse.json({ success: false, error: 'Failed to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({ success: true, signedUrl: data.signedUrl });

  } catch (error: unknown) {
    console.error('Signed URL Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

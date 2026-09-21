import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BUCKET_NAME } from '@/lib/storageHelper';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { validateEmployee } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication (Customer or Staff)
    const rawToken = request.cookies.get('nenkin_customer_token')?.value;
    let isAuthorized = false;

    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const session = await prisma.customerSession.findUnique({ where: { tokenHash } });
      if (session && !session.revokedAt && session.expiresAt >= new Date()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const staff = await validateEmployee();
      if (staff) isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Chưa xác thực người dùng' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const fileList: File[] = [];
    if (files && files.length > 0) fileList.push(...files);
    else if (singleFile) fileList.push(singleFile);

    if (fileList.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có tệp nào được tải lên' }, { status: 400 });
    }

    const uploadedAttachments = [];

    for (const file of fileList) {
      const buffer = await file.arrayBuffer();
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeName = (file.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `chat/${timestamp}_${randomSuffix}_${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('Chat upload error:', uploadError);
        continue;
      }

      const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      uploadedAttachments.push({
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
    }

    if (uploadedAttachments.length === 0) {
      return NextResponse.json({ success: false, error: 'Tải tệp lên thất bại' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: uploadedAttachments });
  } catch (err: any) {
    console.error('Customer chat upload error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tải tệp' }, { status: 500 });
  }
}

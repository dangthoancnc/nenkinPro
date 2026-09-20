import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BUCKET_NAME } from '@/lib/storageHelper';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customerId = (formData.get('customerId') as string) || 'common';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tệp tải lên' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const safeName = (file.name || 'unnamed').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${customerId}/uploads/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (err: any) {
    console.error('General upload error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tải lên máy chủ' }, { status: 500 });
  }
}

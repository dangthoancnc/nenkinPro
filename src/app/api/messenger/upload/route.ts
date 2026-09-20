import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BUCKET_NAME } from '@/lib/storageHelper';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export interface ChatAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const fileList: File[] = [];
    if (files && files.length > 0) {
      fileList.push(...files);
    } else if (singleFile) {
      fileList.push(singleFile);
    }

    if (fileList.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tệp đính kèm nào' }, { status: 400 });
    }

    const uploadedAttachments: ChatAttachment[] = [];

    for (const file of fileList) {
      const buffer = await file.arrayBuffer();
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeName = (file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `chat/${timestamp}_${randomSuffix}_${safeName}`;

      // Upload raw binary to Supabase Storage - Zero Loss / 100% Uncompressed
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error(`Upload chat file error [${safeName}]:`, uploadError);
        continue;
      }

      const { data } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedAttachments.push({
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
    }

    if (uploadedAttachments.length === 0) {
      return NextResponse.json({ success: false, error: 'Tải lên các tệp thất bại' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: uploadedAttachments,
    });
  } catch (err: any) {
    console.error('Messenger upload route error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi xử lý tệp tin' }, { status: 500 });
  }
}

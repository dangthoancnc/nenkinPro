import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { deleteStorageFile } from '@/lib/storageHelper';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { messageId, originalUrl } = body;

    if (!messageId || !originalUrl) {
      return NextResponse.json(
        { success: false, error: 'messageId và originalUrl là bắt buộc' },
        { status: 400 }
      );
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tin nhắn' },
        { status: 404 }
      );
    }

    // 1. Physically delete the original file from Supabase storage
    await deleteStorageFile(originalUrl);

    // 2. Update message attachment metadata in database
    const attachments = Array.isArray(message.attachments) ? [...(message.attachments as any[])] : [];
    let updated = false;

    const updatedAttachments = attachments.map((att) => {
      if (att && (att.originalUrl === originalUrl || att.url === originalUrl)) {
        updated = true;
        return {
          ...att,
          originalUrl: null,
          originalPurged: true,
          purgedAt: new Date().toISOString(),
          purgedByUserId: user.id,
          purgedByUserName: user.name,
        };
      }
      return att;
    });

    if (updated) {
      await (prisma.message as any).update({
        where: { id: messageId },
        data: {
          attachments: updatedAttachments,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa bản ảnh gốc khỏi bộ nhớ lưu trữ thành công để tiết kiệm dung lượng.',
      data: {
        messageId,
        originalUrl,
        attachments: updatedAttachments,
      },
    });
  } catch (err: any) {
    console.error('Delete original attachment error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi xóa tệp gốc' },
      { status: 500 }
    );
  }
}

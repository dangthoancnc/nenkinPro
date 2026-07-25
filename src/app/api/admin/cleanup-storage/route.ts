import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/authorization';
import { cleanupOrphanStorageFolders } from '@/lib/storageHelper';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { user, error } = await requireRole(['ADMIN', 'MANAGER']);
    if (error || !user) return error;

    const result = await cleanupOrphanStorageFolders();
    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp thành công ${result.deletedCount} thư mục rác khỏi Supabase Storage.`,
      deletedFolders: result.deletedFolders
    });
  } catch (err: any) {
    console.error('Storage Cleanup API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

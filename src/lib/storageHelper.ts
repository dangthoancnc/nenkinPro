import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const BUCKET_NAME = 'customer-documents';

/**
 * Trả về đường dẫn lưu trữ chuẩn mực và duy nhất cho từng loại giấy tờ của khách hàng.
 * Đảm bảo cấu trúc: customerId/documentType.ext (Ví dụ: 123-abc/zairyuFront.jpg)
 */
export function getStandardDocumentPath(customerId: string, documentType: string, ext: string = 'jpg'): string {
  const cleanExt = ext.replace(/^\./, '').toLowerCase();
  const cleanDocType = documentType.replace(/[^a-zA-Z0-9_]/g, '');
  return `${customerId}/${cleanDocType}.${cleanExt}`;
}

/**
 * Upload hoặc Ghi đè (Upsert) trực tiếp ảnh của khách hàng vào vị trí chuẩn.
 * Triệt tiêu hoàn toàn trùng lặp và rác lưu trữ.
 */
export async function uploadCustomerDocument(
  customerId: string,
  documentType: string,
  fileBuffer: ArrayBuffer,
  contentType: string,
  ext: string = 'jpg'
): Promise<string | null> {
  if (!customerId) return null;

  try {
    const filePath = getStandardDocumentPath(customerId, documentType, ext);
    
    // Upsert = true tự động ghi đè file cũ cùng vị trí nếu có
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading document to ${filePath}:`, uploadError);
      return null;
    }

    const { data } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Error in uploadCustomerDocument:', err);
    return null;
  }
}

/**
 * Xóa một file khỏi Supabase Storage dựa trên URL công khai của nó
 */
export async function deleteStorageFile(url: string) {
  if (!url || !url.includes('/storage/v1/object/public/')) return;
  try {
    const part = `/${BUCKET_NAME}/`;
    const index = url.indexOf(part);
    if (index === -1) return;
    const filePath = decodeURIComponent(url.substring(index + part.length));

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error(`Failed to delete storage file from path: ${filePath}`, error);
    } else {
      console.log(`Successfully deleted storage file: ${filePath}`);
    }
  } catch (err) {
    console.error('Error in deleteStorageFile:', err);
  }
}

/**
 * Liệt kê đệ quy toàn bộ file (bao gồm các thư mục con như customerId/departure/file.jpg)
 */
export async function listAllFilesRecursively(prefix: string): Promise<string[]> {
  const allPaths: string[] = [];
  try {
    const { data: items, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(prefix, { limit: 1000 });

    if (error || !items) return [];

    for (const item of items) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      // Dynamic folder detection in Supabase storage (folders have no id or mimetype === 'folder')
      if (!item.id || item.metadata?.mimetype === 'folder' || !item.metadata) {
        const subFiles = await listAllFilesRecursively(itemPath);
        allPaths.push(...subFiles);
      } else {
        allPaths.push(itemPath);
      }
    }
  } catch (err) {
    console.error('Error listing files recursively:', err);
  }
  return allPaths;
}

/**
 * Xóa toàn bộ thư mục lưu trữ của một khách hàng (khi xóa khách hàng hoặc dọn dẹp nháp)
 */
export async function deleteCustomerFolder(customerId: string): Promise<boolean> {
  if (!customerId) return false;
  try {
    const allFilePaths = await listAllFilesRecursively(customerId);

    if (allFilePaths.length === 0) return true;

    const { error: removeError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(allFilePaths);

    if (removeError) {
      console.error(`Failed to delete folder for customer ${customerId}:`, removeError);
      return false;
    }
    console.log(`Successfully deleted folder ${customerId} with ${allFilePaths.length} files recursively.`);
    return true;
  } catch (err) {
    console.error(`Error deleting customer folder ${customerId}:`, err);
    return false;
  }
}

/**
 * Hỗ trợ di chuyển file từ thư mục tạm nếu có
 */
export async function moveStorageFile(oldUrl: string, customerId: string, documentType: string): Promise<string> {
  if (!oldUrl || !oldUrl.includes(`/${BUCKET_NAME}/`)) {
    return oldUrl;
  }

  try {
    const part = `/${BUCKET_NAME}/`;
    const index = oldUrl.indexOf(part);
    if (index === -1) return oldUrl;

    const oldPath = decodeURIComponent(oldUrl.substring(index + part.length));
    const pathParts = oldPath.split('.');
    const ext = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'jpg';

    const newPath = getStandardDocumentPath(customerId, documentType, ext);
    if (oldPath === newPath) return oldUrl;

    const { error: copyErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .copy(oldPath, newPath);

    if (copyErr) {
      console.error(`Failed to copy storage file from ${oldPath} to ${newPath}:`, copyErr);
      return oldUrl;
    }

    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([oldPath]);

    const { data } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newPath);

    return data.publicUrl;
  } catch (err) {
    console.error('Error in moveStorageFile:', err);
    return oldUrl;
  }
}

/**
 * Quản lý & Dọn dẹp kho lưu trữ khoa học:
 * Quét toàn bộ thư mục trong Supabase Storage bucket, so sánh với DB.
 * Xóa toàn bộ các thư mục rác (nháp cũ draft_*, anonymous, test_* hoặc các ID khách hàng không tồn tại trong DB).
 */
export async function cleanupOrphanStorageFolders(): Promise<{ deletedCount: number; deletedFolders: string[] }> {
  const deletedFolders: string[] = [];
  try {
    const { data: rootItems, error: listErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (listErr || !rootItems) {
      console.error('Failed to list root storage folders:', listErr);
      return { deletedCount: 0, deletedFolders: [] };
    }

    // Get all valid customer IDs from database
    const { default: prisma } = await import('@/lib/prisma');
    const dbCustomers = await prisma.customer.findMany({ select: { id: true } });
    const validCustomerIds = new Set(dbCustomers.map(c => c.id));

    for (const item of rootItems) {
      const folderName = item.name;

      // Identify orphan conditions:
      // 1. Starts with draft_, anonymous, or test_
      // 2. Or is a UUID string that is NOT in DB active customers
      const isDraftOrTest = folderName.startsWith('draft_') || folderName.startsWith('anonymous') || folderName.startsWith('test_');
      const isOrphanCustomer = !validCustomerIds.has(folderName);

      if (isDraftOrTest || isOrphanCustomer) {
        const success = await deleteCustomerFolder(folderName);
        if (success) {
          deletedFolders.push(folderName);
        }
      }
    }

    console.log(`[STORAGE CLEANUP] Successfully cleaned ${deletedFolders.length} orphan folders:`, deletedFolders);
    return { deletedCount: deletedFolders.length, deletedFolders };
  } catch (err) {
    console.error('Error in cleanupOrphanStorageFolders:', err);
    return { deletedCount: 0, deletedFolders: [] };
  }
}

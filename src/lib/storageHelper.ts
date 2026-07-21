import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Xóa một file khỏi Supabase Storage dựa trên URL công khai của nó
 */
export async function deleteStorageFile(url: string) {
  if (!url || !url.includes('/storage/v1/object/public/')) return;
  try {
    const part = '/customer-documents/';
    const index = url.indexOf(part);
    if (index === -1) return;
    const filePath = decodeURIComponent(url.substring(index + part.length));

    const { error } = await supabaseAdmin.storage
      .from('customer-documents')
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
 * Di chuyển file từ thư mục tạm 'anonymous' sang thư mục chính thức của 'customerId'
 */
export async function moveStorageFile(oldUrl: string, customerId: string, documentType: string): Promise<string> {
  if (!oldUrl || !oldUrl.includes('/customer-documents/anonymous/')) {
    return oldUrl;
  }

  try {
    const part = '/customer-documents/';
    const index = oldUrl.indexOf(part);
    if (index === -1) return oldUrl;

    const oldPath = decodeURIComponent(oldUrl.substring(index + part.length));

    // Lấy tên file gốc
    const pathParts = oldPath.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Tạo đường dẫn mới theo customerId
    const newPath = `${customerId}/${documentType}/${filename}`;

    // Sao chép sang đường dẫn mới
    const { error: copyErr } = await supabaseAdmin.storage
      .from('customer-documents')
      .copy(oldPath, newPath);

    if (copyErr) {
      console.error(`Failed to copy storage file from ${oldPath} to ${newPath}:`, copyErr);
      return oldUrl;
    }

    // Xóa file tạm ở anonymous
    const { error: removeErr } = await supabaseAdmin.storage
      .from('customer-documents')
      .remove([oldPath]);

    if (removeErr) {
      console.error(`Failed to remove temporary storage file: ${oldPath}`, removeErr);
    }

    // Trả về public URL mới
    const newUrl = oldUrl.replace(oldPath, newPath);
    return newUrl;
  } catch (err) {
    console.error('Error in moveStorageFile:', err);
    return oldUrl;
  }
}

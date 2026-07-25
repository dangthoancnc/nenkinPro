import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import { fetchNtaTaxOfficeByZip } from '@/lib/ntaHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip') || '';

  try {
    const data = await fetchNtaTaxOfficeByZip(zip);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Mã bưu điện không hợp lệ (phải có 7 chữ số).' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('NTA Lookup Error:', error);
    let errorMsg = error.message || 'Lỗi tra cứu Cục thuế';
    let status = 500;
    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota exceeded')) {
      errorMsg = 'Hạn ngạch (Quota) tra cứu bị quá tải (429). Vui lòng đợi khoảng 20-30 giây rồi thử lại!';
      status = 429;
    }
    return NextResponse.json({ success: false, error: errorMsg }, { status });
  }
}

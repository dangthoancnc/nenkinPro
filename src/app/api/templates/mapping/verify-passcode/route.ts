import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/authorization';

export async function POST(request: NextRequest) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  if (user.role === 'ADMIN') {
    return NextResponse.json({ success: true, isAdmin: true, message: 'Đã xác thực với quyền Quản trị viên' });
  }

  try {
    const body = await request.json();
    const { passcode } = body;
    const validPasscode = process.env.PDF_MAPPER_PASSCODE || 'nenkin@admin2026';

    if (passcode && passcode === validPasscode) {
      return NextResponse.json({ success: true, isAdmin: false, message: 'Đã xác thực Mật khẩu Cấp 2 thành công' });
    }

    return NextResponse.json({ success: false, error: 'Mật khẩu Cấp 2 Quản trị không chính xác' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi kiểm tra mật khẩu' }, { status: 500 });
  }
}

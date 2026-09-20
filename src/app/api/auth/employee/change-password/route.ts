import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ các thông tin mật khẩu.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' }, { status: 400 });
    }

    // Lookup user record to get current hashed password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản người dùng.' }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(dbUser.password, currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json({ success: false, error: 'Mật khẩu hiện tại không chính xác.' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo.' 
    });

  } catch (err: any) {
    console.error('Change password error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi hệ thống khi đổi mật khẩu' }, { status: 500 });
  }
}

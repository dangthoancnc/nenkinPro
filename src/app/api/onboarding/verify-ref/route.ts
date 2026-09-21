import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Chưa nhập mã giới thiệu' });
    }

    // 1. Check Staff / Collaborator code
    const staffUser = await prisma.user.findUnique({
      where: { staffCode: code },
      select: { name: true, staffCode: true }
    });

    if (staffUser) {
      return NextResponse.json({
        valid: true,
        type: 'STAFF',
        name: staffUser.name,
        message: `Mã Nhân Viên / CTV: ${staffUser.name}`
      });
    }

    // 2. Check Customer referral code
    const referringCustomer = await prisma.customer.findUnique({
      where: { code },
      select: { fullName: true, code: true }
    });

    if (referringCustomer) {
      return NextResponse.json({
        valid: true,
        type: 'CUSTOMER',
        name: referringCustomer.fullName,
        message: `Mã Giới Thiệu: ${referringCustomer.fullName} · Giảm ngay 2.000 JPY`
      });
    }

    return NextResponse.json({
      valid: false,
      message: 'Mã giới thiệu không tồn tại trong hệ thống'
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}

import { requireRole } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function POST() {
  const { user, error } = await requireRole(['ADMIN']);
  if (error || !user) return error;

  try {
    const p1 = await hashPassword("duyen2026");
    const p2 = await hashPassword("long2026");

    const staffData = [
      { email: "daoduyen1102@gmail.com", password: p1, name: "Dao Thi Duyen", role: "MANAGER" as const, staffCode: "NV001" },
      { email: "nguyenvanlong@vietnenkin.com", password: p2, name: "Nguyen Van Long", role: "MANAGER" as const, staffCode: "NV002" },
    ];

    const results = [];
    for (const staff of staffData) {
      const user = await prisma.user.upsert({
        where: { email: staff.email },
        update: { name: staff.name, role: staff.role, staffCode: staff.staffCode },
        create: staff,
      });
      results.push({ id: user.id, name: user.name, email: user.email, role: user.role, staffCode: user.staffCode });
    }

    return NextResponse.json({ success: true, data: results, message: `${results.length} nhân sự đã được cập nhật.` });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

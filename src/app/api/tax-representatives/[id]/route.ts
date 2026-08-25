import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { taxRepresentativeSchema, buildTaxRepData } from '@/lib/validations/taxRepresentativeSchema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  const { id } = await params;

  try {
    const representative = await prisma.taxRepresentative.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!representative) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy người đại diện thuế' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: representative });
  } catch (err: any) {
    console.error('Error fetching tax representative:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = taxRepresentativeSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const existing = await prisma.taxRepresentative.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy người đại diện' }, { status: 404 });
    }

    // Merge & build data
    const mergedInput = {
      fullName:            parsed.data.fullName ?? existing.fullName,
      fullNameKana:        parsed.data.fullNameKana !== undefined ? parsed.data.fullNameKana : existing.fullNameKana,
      address:             parsed.data.address ?? existing.address,
      postalCode:          parsed.data.postalCode ?? existing.postalCode,
      phone:               parsed.data.phone !== undefined ? parsed.data.phone : existing.phone,
      myNumber:            parsed.data.myNumber !== undefined ? parsed.data.myNumber : existing.myNumber,
      relationship:        parsed.data.relationship !== undefined ? parsed.data.relationship : existing.relationship,
      occupation:          parsed.data.occupation !== undefined ? parsed.data.occupation : existing.occupation,
      dob:                 parsed.data.dob !== undefined ? parsed.data.dob : (existing.dob ? existing.dob.toISOString().slice(0, 10) : null),
      
      bankName:            parsed.data.bankName !== undefined ? parsed.data.bankName : existing.bankName,
      branchName:          parsed.data.branchName !== undefined ? parsed.data.branchName : existing.branchName,
      accountNumber:       parsed.data.accountNumber !== undefined ? parsed.data.accountNumber : existing.accountNumber,
      accountName:         parsed.data.accountName !== undefined ? parsed.data.accountName : existing.accountName,
      accountNameKatakana: parsed.data.accountNameKatakana !== undefined ? parsed.data.accountNameKatakana : existing.accountNameKatakana,
      isYucho:             parsed.data.isYucho !== undefined ? parsed.data.isYucho : existing.isYucho,
      bankAccountType:     parsed.data.bankAccountType !== undefined ? parsed.data.bankAccountType : existing.bankAccountType,
      yuchoKigo:           parsed.data.yuchoKigo !== undefined ? parsed.data.yuchoKigo : existing.yuchoKigo,
      yuchoBango:          parsed.data.yuchoBango !== undefined ? parsed.data.yuchoBango : existing.yuchoBango,
    };

    const data = buildTaxRepData(mergedInput as any);
    const updated = await prisma.taxRepresentative.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('Error updating tax representative:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  const { id } = await params;

  try {
    const existing = await prisma.taxRepresentative.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy người đại diện' }, { status: 404 });
    }

    if (existing._count.applications > 0) {
      return NextResponse.json({
        success: false,
        error: `Không thể xóa vì đang có ${existing._count.applications} hồ sơ liên kết với Người đại diện này.`
      }, { status: 400 });
    }

    await prisma.taxRepresentative.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Đã xóa người đại diện thuế' });
  } catch (err: any) {
    console.error('Error deleting tax representative:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

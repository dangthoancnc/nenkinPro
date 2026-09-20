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
        bankAccounts: {
          orderBy: { isDefault: 'desc' }
        },
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
    const existing = await prisma.taxRepresentative.findUnique({
      where: { id },
      include: { bankAccounts: true }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy người đại diện' }, { status: 404 });
    }

    const rawBankAccounts = parsed.data.bankAccounts;
    const defaultAcc = rawBankAccounts ? (rawBankAccounts.find(a => a.isDefault) || rawBankAccounts[0]) : null;

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
      
      bankName:            defaultAcc ? (defaultAcc.bankName || null) : (parsed.data.bankName !== undefined ? parsed.data.bankName : existing.bankName),
      branchName:          defaultAcc ? (defaultAcc.branchName || null) : (parsed.data.branchName !== undefined ? parsed.data.branchName : existing.branchName),
      accountNumber:       defaultAcc ? (defaultAcc.accountNumber || null) : (parsed.data.accountNumber !== undefined ? parsed.data.accountNumber : existing.accountNumber),
      accountName:         defaultAcc ? (defaultAcc.accountName || null) : (parsed.data.accountName !== undefined ? parsed.data.accountName : existing.accountName),
      accountNameKatakana: defaultAcc ? (defaultAcc.accountNameKatakana || null) : (parsed.data.accountNameKatakana !== undefined ? parsed.data.accountNameKatakana : existing.accountNameKatakana),
      isYucho:             defaultAcc ? Boolean(defaultAcc.isYucho) : (parsed.data.isYucho !== undefined ? parsed.data.isYucho : existing.isYucho),
      bankAccountType:     defaultAcc ? (defaultAcc.bankAccountType || 'ORDINARY') : (parsed.data.bankAccountType !== undefined ? parsed.data.bankAccountType : existing.bankAccountType),
      yuchoKigo:           defaultAcc ? (defaultAcc.yuchoKigo || null) : (parsed.data.yuchoKigo !== undefined ? parsed.data.yuchoKigo : existing.yuchoKigo),
      yuchoBango:          defaultAcc ? (defaultAcc.yuchoBango || null) : (parsed.data.yuchoBango !== undefined ? parsed.data.yuchoBango : existing.yuchoBango),
      linkedUserId:        parsed.data.linkedUserId !== undefined ? parsed.data.linkedUserId : (existing as any).linkedUserId,
    };

    const data = buildTaxRepData(mergedInput as any);

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update TaxRepresentative
      const rep = await tx.taxRepresentative.update({
        where: { id },
        data,
      });

      // 2. Synchronize bankAccounts if provided
      if (rawBankAccounts && Array.isArray(rawBankAccounts)) {
        const keptIds: string[] = [];

        for (let i = 0; i < rawBankAccounts.length; i++) {
          const acc = rawBankAccounts[i];
          const isDef = defaultAcc ? acc === defaultAcc : i === 0;

          if (acc.id && existing.bankAccounts.some(b => b.id === acc.id)) {
            // Update existing bank account
            await tx.taxRepBankAccount.update({
              where: { id: acc.id },
              data: {
                isDefault: isDef,
                bankName: acc.bankName || null,
                branchName: acc.branchName || null,
                accountNumber: acc.accountNumber || null,
                accountName: acc.accountName || rep.fullName,
                accountNameKatakana: acc.accountNameKatakana || rep.fullNameKana,
                isYucho: Boolean(acc.isYucho),
                bankAccountType: acc.bankAccountType || 'ORDINARY',
                yuchoKigo: acc.yuchoKigo || null,
                yuchoBango: acc.yuchoBango || null,
              }
            });
            keptIds.push(acc.id);
          } else {
            // Create new bank account
            const createdAcc = await tx.taxRepBankAccount.create({
              data: {
                taxRepresentativeId: id,
                isDefault: isDef,
                bankName: acc.bankName || null,
                branchName: acc.branchName || null,
                accountNumber: acc.accountNumber || null,
                accountName: acc.accountName || rep.fullName,
                accountNameKatakana: acc.accountNameKatakana || rep.fullNameKana,
                isYucho: Boolean(acc.isYucho),
                bankAccountType: acc.bankAccountType || 'ORDINARY',
                yuchoKigo: acc.yuchoKigo || null,
                yuchoBango: acc.yuchoBango || null,
              }
            });
            keptIds.push(createdAcc.id);
          }
        }

        // Remove bank accounts that were deleted in the UI
        const toDelete = existing.bankAccounts.filter(b => !keptIds.includes(b.id));
        for (const del of toDelete) {
          // Unlink applications pointing to this deleted account first
          await tx.nenkinApplication.updateMany({
            where: { taxRepBankAccountId: del.id },
            data: { taxRepBankAccountId: null }
          });
          await tx.taxRepBankAccount.delete({ where: { id: del.id } });
        }
      }

      return await tx.taxRepresentative.findUnique({
        where: { id },
        include: {
          bankAccounts: {
            orderBy: { isDefault: 'desc' }
          }
        }
      });
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

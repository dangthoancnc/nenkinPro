import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { taxRepresentativeSchema, buildTaxRepData } from '@/lib/validations/taxRepresentativeSchema';

export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const representatives = await prisma.taxRepresentative.findMany({
      include: {
        bankAccounts: {
          orderBy: { isDefault: 'desc' }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: representatives });
  } catch (err: any) {
    console.error('Error fetching tax representatives:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = taxRepresentativeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const rawBankAccounts = parsed.data.bankAccounts || [];
    const defaultAcc = rawBankAccounts.find(a => a.isDefault) || rawBankAccounts[0];

    const data = buildTaxRepData(parsed.data);
    // If a default bank account is provided in array, sync top-level fields
    if (defaultAcc) {
      data.bankName = defaultAcc.bankName || data.bankName;
      data.branchName = defaultAcc.branchName || data.branchName;
      data.accountNumber = defaultAcc.accountNumber || data.accountNumber;
      data.accountName = defaultAcc.accountName || data.accountName;
      data.accountNameKatakana = defaultAcc.accountNameKatakana || data.accountNameKatakana;
      data.isYucho = Boolean(defaultAcc.isYucho);
      data.bankAccountType = defaultAcc.bankAccountType || data.bankAccountType;
      data.yuchoKigo = defaultAcc.yuchoKigo || data.yuchoKigo;
      data.yuchoBango = defaultAcc.yuchoBango || data.yuchoBango;
    }

    const taxRep = await prisma.$transaction(async (tx) => {
      const createdRep = await tx.taxRepresentative.create({ data });

      if (rawBankAccounts.length > 0) {
        for (let i = 0; i < rawBankAccounts.length; i++) {
          const acc = rawBankAccounts[i];
          const isDef = defaultAcc ? acc === defaultAcc : i === 0;
          await tx.taxRepBankAccount.create({
            data: {
              taxRepresentativeId: createdRep.id,
              isDefault: isDef,
              bankName: acc.bankName || null,
              branchName: acc.branchName || null,
              accountNumber: acc.accountNumber || null,
              accountName: acc.accountName || createdRep.fullName,
              accountNameKatakana: acc.accountNameKatakana || createdRep.fullNameKana,
              isYucho: Boolean(acc.isYucho),
              bankAccountType: acc.bankAccountType || 'ORDINARY',
              yuchoKigo: acc.yuchoKigo || null,
              yuchoBango: acc.yuchoBango || null,
            }
          });
        }
      } else if (data.bankName || data.accountNumber || data.yuchoKigo) {
        // Fallback: create default bank account from top-level fields
        await tx.taxRepBankAccount.create({
          data: {
            taxRepresentativeId: createdRep.id,
            isDefault: true,
            bankName: data.bankName,
            branchName: data.branchName,
            accountNumber: data.accountNumber,
            accountName: data.accountName || createdRep.fullName,
            accountNameKatakana: data.accountNameKatakana || createdRep.fullNameKana,
            isYucho: data.isYucho,
            bankAccountType: data.bankAccountType || 'ORDINARY',
            yuchoKigo: data.yuchoKigo,
            yuchoBango: data.yuchoBango,
          }
        });
      }

      return await tx.taxRepresentative.findUnique({
        where: { id: createdRep.id },
        include: { bankAccounts: true }
      });
    });

    return NextResponse.json({ success: true, data: taxRep }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating tax representative:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

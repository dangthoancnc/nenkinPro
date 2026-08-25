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
    const data = buildTaxRepData(parsed.data);
    const taxRep = await prisma.taxRepresentative.create({ data });
    return NextResponse.json({ success: true, data: taxRep }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating tax representative:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

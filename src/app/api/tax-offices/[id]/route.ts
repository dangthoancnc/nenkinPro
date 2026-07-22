import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';
import { z } from 'zod';

// ─── Zod schema (partial — all fields optional for PATCH-style PUT) ───────────
const taxOfficeUpdateSchema = z.object({
  name:               z.string().min(1).optional(),
  romajiName:         z.string().nullable().optional(),
  postalCode:         z.string().min(7).max(8).optional(),
  address:            z.string().min(1).optional(),
  romajiAddress:      z.string().nullable().optional(),
  phone:              z.string().nullable().optional(),
  websiteUrl:         z.string().url().nullable().optional().or(z.literal('')),
  mapUrl:             z.string().url().nullable().optional().or(z.literal('')),
  receptionInfo:      z.string().nullable().optional(),
  notes:              z.string().nullable().optional(),
  // --- Mailing fields (C.1 / C.2) ---
  mailingName:        z.string().nullable().optional(),
  mailingPostalCode:  z.string().max(8).nullable().optional(),
  mailingAddress:     z.string().nullable().optional(),
  // --- Extra contacts ---
  jurisdiction:       z.string().nullable().optional(),
  consultationPhone:  z.string().nullable().optional(),
  generalPhone:       z.string().nullable().optional(),
});

/** Normalize empty strings to null */
function n(v: string | null | undefined): string | null {
  return v?.trim() || null;
}

// ─── GET /api/tax-offices/[id] ────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error: authError } = await requireStaff();
  if (authError || !user) return authError;

  const { id } = await params;

  try {
    const taxOffice = await prisma.taxOffice.findUnique({
      where: { id },
      include: { _count: { select: { customers: true } } },
    });

    if (!taxOffice) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy cục thuế' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: taxOffice });
  } catch (err: unknown) {
    console.error('[tax-offices/id] GET error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

// ─── PUT /api/tax-offices/[id] ────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error: authError } = await requireStaff();
  if (authError || !user) return authError;

  const { id } = await params;

  // 1. Parse
  let raw: unknown;
  try { raw = await req.json(); }
  catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Validate
  const parsed = taxOfficeUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // 3. Build update payload — only include keys present in body
  const body = parsed.data;
  const data: Record<string, unknown> = {};

  if (body.name               !== undefined) data.name               = body.name!.trim();
  if (body.romajiName         !== undefined) data.romajiName         = n(body.romajiName);
  if (body.postalCode         !== undefined) data.postalCode         = body.postalCode!.trim();
  if (body.address            !== undefined) data.address            = body.address!.trim();
  if (body.romajiAddress      !== undefined) data.romajiAddress      = n(body.romajiAddress);
  if (body.phone              !== undefined) data.phone              = n(body.phone);
  if (body.websiteUrl         !== undefined) data.websiteUrl         = n(body.websiteUrl);
  if (body.mapUrl             !== undefined) data.mapUrl             = n(body.mapUrl);
  if (body.receptionInfo      !== undefined) data.receptionInfo      = n(body.receptionInfo);
  if (body.notes              !== undefined) data.notes              = n(body.notes);
  if (body.mailingName        !== undefined) data.mailingName        = n(body.mailingName);
  if (body.mailingPostalCode  !== undefined) data.mailingPostalCode  = n(body.mailingPostalCode);
  if (body.mailingAddress     !== undefined) data.mailingAddress     = n(body.mailingAddress);
  if (body.jurisdiction       !== undefined) data.jurisdiction       = n(body.jurisdiction);
  if (body.consultationPhone  !== undefined) data.consultationPhone  = n(body.consultationPhone);
  if (body.generalPhone       !== undefined) data.generalPhone       = n(body.generalPhone);

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Không có trường nào được cập nhật' },
      { status: 400 },
    );
  }

  try {
    const taxOffice = await prisma.taxOffice.update({
      where: { id },
      data,
    });
    return NextResponse.json({ success: true, data: taxOffice });
  } catch (err: unknown) {
    console.error('[tax-offices/id] PUT error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/tax-offices/[id] ────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error: authError } = await requireStaff();
  if (authError || !user) return authError;

  const { id } = await params;

  try {
    const customerCount = await prisma.customer.count({
      where: { taxOfficeId: id },
    });

    if (customerCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể xóa — đang có ${customerCount} khách hàng trực thuộc. Hãy đổi cục thuế cho khách hàng trước.`,
        },
        { status: 409 },
      );
    }

    await prisma.taxOffice.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Đã xóa Cục thuế thành công' });
  } catch (err: unknown) {
    console.error('[tax-offices/id] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

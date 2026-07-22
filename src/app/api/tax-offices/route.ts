import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// ─── Zod schema (mirrors TaxOfficeForm) ──────────────────────────────────────
const taxOfficeUpsertSchema = z.object({
  name:               z.string().min(1, 'Bắt buộc'),
  romajiName:         z.string().optional().nullable(),
  postalCode:         z.string().min(7).max(8),
  address:            z.string().min(1, 'Bắt buộc'),
  romajiAddress:      z.string().optional().nullable(),
  phone:              z.string().optional().nullable(),
  websiteUrl:         z.string().url().optional().nullable().or(z.literal('')),
  mapUrl:             z.string().url().optional().nullable().or(z.literal('')),
  receptionInfo:      z.string().optional().nullable(),
  notes:              z.string().optional().nullable(),
  // --- Mailing ---
  mailingName:        z.string().optional().nullable(),
  mailingPostalCode:  z.string().max(8).optional().nullable(),
  mailingAddress:     z.string().optional().nullable(),
  // --- Contacts ---
  jurisdiction:       z.string().optional().nullable(),
  consultationPhone:  z.string().optional().nullable(),
  generalPhone:       z.string().optional().nullable(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Normalize empty strings to null for optional fields */
function nullify(v: string | null | undefined): string | null {
  return v?.trim() || null;
}

function buildData(body: z.infer<typeof taxOfficeUpsertSchema>) {
  return {
    name:               body.name.trim(),
    romajiName:         nullify(body.romajiName),
    postalCode:         body.postalCode.trim(),
    address:            body.address.trim(),
    romajiAddress:      nullify(body.romajiAddress),
    phone:              nullify(body.phone),
    websiteUrl:         nullify(body.websiteUrl),
    mapUrl:             nullify(body.mapUrl),
    receptionInfo:      nullify(body.receptionInfo),
    notes:              nullify(body.notes),
    mailingName:        nullify(body.mailingName),
    mailingPostalCode:  nullify(body.mailingPostalCode),
    mailingAddress:     nullify(body.mailingAddress),
    jurisdiction:       nullify(body.jurisdiction),
    consultationPhone:  nullify(body.consultationPhone),
    generalPhone:       nullify(body.generalPhone),
  };
}

// ─── GET /api/tax-offices ─────────────────────────────────────────────────────
export async function GET() {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const taxOffices = await prisma.taxOffice.findMany({
      include: { _count: { select: { customers: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: taxOffices });
  } catch (err: unknown) {
    console.error('[tax-offices] GET error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

// ─── POST /api/tax-offices ─── upsert by name ────────────────────────────────
export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  // 1. Parse body
  let raw: unknown;
  try { raw = await req.json(); }
  catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Validate
  const parsed = taxOfficeUpsertSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const data = buildData(parsed.data);

    // Upsert by name (idempotent — same name = update existing)
    const existing = await prisma.taxOffice.findFirst({ where: { name: data.name } });
    const taxOffice = existing
      ? await prisma.taxOffice.update({ where: { id: existing.id }, data })
      : await prisma.taxOffice.create({ data });

    return NextResponse.json(
      { success: true, data: taxOffice },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error('[tax-offices] POST upsert error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

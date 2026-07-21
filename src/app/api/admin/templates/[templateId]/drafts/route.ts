import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/authorization';
import { createTemplateDraft } from '@/features/templates/template-draft-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { user, error } = await requireRole(['ADMIN', 'MANAGER']);
  if (error || !user) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { templateId } = await params;

  const result = await createTemplateDraft(
    { ...(body as object), templateId },
    user.id,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(
    { id: result.draftId, draftNumber: result.draftNumber },
    { status: 201 },
  );
}

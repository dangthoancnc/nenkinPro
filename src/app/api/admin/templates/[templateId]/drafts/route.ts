import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/serverAuth';
import { createTemplateDraft } from '@/features/templates/template-draft-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const user = await validateEmployee();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

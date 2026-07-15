'server-only';

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { FieldMappingSchema } from './template-schema';
import { getTemplateVersion } from './template-registry';
import type { SaveDraftResult } from './mapper-types';

const SaveDraftInputSchema = z.object({
  templateId: z.string().min(1),
  baseVersionId: z.string().min(1),
  changeNote: z.string().min(1).max(1000),
  fieldMappings: z.array(FieldMappingSchema).min(1).max(300),
});

export async function createTemplateDraft(
  input: unknown,
  createdById: string,
): Promise<SaveDraftResult> {
  const parsed = SaveDraftInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const { templateId, baseVersionId, changeNote, fieldMappings } = parsed.data;

  const baseVersion = getTemplateVersion(templateId, baseVersionId);
  if (!baseVersion) {
    return {
      ok: false,
      error: `Không tìm thấy version '${baseVersionId}' của template '${templateId}'`,
    };
  }

  for (const field of fieldMappings) {
    if (field.coordinate.page > baseVersion.pageCount) {
      return {
        ok: false,
        error: `Field '${field.id}' có page=${field.coordinate.page} vượt quá pageCount=${baseVersion.pageCount}`,
      };
    }
  }

  const lastDraft = await prisma.templateDraft.findFirst({
    where: { templateId },
    orderBy: { draftNumber: 'desc' },
    select: { draftNumber: true },
  });

  const draftNumber = (lastDraft?.draftNumber ?? 0) + 1;

  const draft = await prisma.templateDraft.create({
    data: {
      templateId,
      baseVersionId,
      draftNumber,
      fieldMappings: fieldMappings as object,
      changeNote,
      createdById,
    },
    select: { id: true, draftNumber: true },
  });

  return { ok: true, draftId: draft.id, draftNumber: draft.draftNumber };
}

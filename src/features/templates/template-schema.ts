import { z } from 'zod';

export const TemplateLifecycleSchema = z.enum([
  'draft',
  'review',
  'published',
  'archived',
]);

export type TemplateLifecycle = z.infer<typeof TemplateLifecycleSchema>;

export const PdfCoordinateSchema = z.object({
  page: z.number().int().positive(),
  x: z.number().finite().nonnegative(),
  y: z.number().finite().nonnegative(),
});

export type PdfCoordinate = z.infer<typeof PdfCoordinateSchema>;

export const TextAlignmentSchema = z.enum(['left', 'center', 'right']);

export const SplitModeSchema = z.enum([
  'none',
  'character-boxes',
  'date-japanese-era',
  'postal-code',
  'residence-card-number',
  'bank-account-number',
]);

export type SplitMode = z.infer<typeof SplitModeSchema>;

export const FieldMappingSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z][a-z0-9_.-]*$/, 'Field ID must be a stable dot-path'),

  label: z.string().min(1).max(200),

  sourcePath: z
    .string()
    .min(1)
    .max(180)
    .regex(/^[a-z][a-z0-9_.-]*$/, 'sourcePath must be a stable dot-path'),

  coordinate: PdfCoordinateSchema,

  font: z.object({
    family: z.enum(['NotoSansJP', 'NotoSans', 'NotoSerifJP']),
    size: z.number().min(5).max(32),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),

  align: TextAlignmentSchema.default('left'),

  maxWidth: z.number().positive().max(2000).optional(),

  maxLines: z.number().int().positive().max(10).default(1),

  lineHeight: z.number().min(1).max(48).optional(),

  baselineOffset: z.number().min(-48).max(48).default(0),

  splitMode: SplitModeSchema.default('none'),

  characterBoxes: z
    .array(PdfCoordinateSchema)
    .min(1)
    .max(40)
    .optional(),

  required: z.boolean().default(false),

  enabled: z.boolean().default(true),

  notes: z.string().max(500).optional(),
}).superRefine((field, ctx) => {
  if (field.splitMode === 'character-boxes' && !field.characterBoxes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['characterBoxes'],
      message: 'characterBoxes is required when splitMode is character-boxes',
    });
  }

  if (field.splitMode !== 'character-boxes' && field.characterBoxes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['characterBoxes'],
      message: 'characterBoxes is only allowed when splitMode is character-boxes',
    });
  }
});

export type FieldMapping = z.infer<typeof FieldMappingSchema>;

export const TemplateVersionSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),

  version: z.number().int().positive(),

  status: TemplateLifecycleSchema,

  sourcePdfPath: z.string().regex(/^\/templates\/.+\.pdf$/),

  pdfFingerprint: z
    .string()
    .regex(/^[a-f0-9]{64}$/, 'Expected SHA-256 fingerprint'),

  pageCount: z.number().int().positive(),

  coordinateSystem: z.literal('pdf-points-bottom-left'),

  fieldMappings: z.array(FieldMappingSchema).min(1).max(300),

  createdAt: z.string().datetime(),

  createdBy: z.string().min(1),

  reviewedAt: z.string().datetime().optional(),

  reviewedBy: z.string().min(1).optional(),

  publishedAt: z.string().datetime().optional(),

  publishedBy: z.string().min(1).optional(),

  changeNote: z.string().min(1).max(1000),
}).superRefine((version, ctx) => {
  const fieldIds = new Set<string>();

  for (const [index, field] of version.fieldMappings.entries()) {
    if (fieldIds.has(field.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fieldMappings', index, 'id'],
        message: `Duplicate field id: ${field.id}`,
      });
    }

    fieldIds.add(field.id);

    if (field.coordinate.page > version.pageCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fieldMappings', index, 'coordinate', 'page'],
        message: 'Field page cannot exceed pageCount',
      });
    }
  }

  const isPublished = version.status === 'published';

  if (
    isPublished &&
    (!version.reviewedAt ||
      !version.reviewedBy ||
      !version.publishedAt ||
      !version.publishedBy)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Published template versions require review and publish metadata',
    });
  }
});

export type TemplateVersion = z.infer<typeof TemplateVersionSchema>;

export const DocumentTemplateSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, 'Template ID must be kebab-case'),

  title: z.string().min(1).max(200),

  description: z.string().min(1).max(1000),

  category: z.enum([
    'nenkin-withdrawal',
    'power-of-attorney',
    'tax-representative',
    'supporting-document',
  ]),

  activeVersionId: z.string().min(1).nullable(),

  versions: z.array(TemplateVersionSchema).min(1),
});

export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;

export function assertPublishable(
  template: DocumentTemplate,
  version: TemplateVersion,
): void {
  if (version.templateId !== template.id) {
    throw new Error('Template version does not belong to template');
  }

  const parsed = TemplateVersionSchema.safeParse(version);

  if (!parsed.success) {
    throw new Error(
      `Invalid template version: ${parsed.error.issues
        .map((issue) => issue.message)
        .join('; ')}`,
    );
  }

  if (version.status !== 'review') {
    throw new Error('Only a reviewed version can be published');
  }
}

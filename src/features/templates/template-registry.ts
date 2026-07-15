import {
  DocumentTemplateSchema,
  type DocumentTemplate,
  type TemplateVersion,
} from './template-schema';
import { donXinLan1Template } from './fixtures/don-xin-lan-1';

const templates = new Map<string, DocumentTemplate>(
  [donXinLan1Template].map((template) => {
    const parsed = DocumentTemplateSchema.parse(template);
    return [parsed.id, parsed];
  }),
);

export function listTemplates(): DocumentTemplate[] {
  return Array.from(templates.values()).map((template) =>
    structuredClone(template),
  );
}

export function getTemplate(templateId: string): DocumentTemplate | null {
  const template = templates.get(templateId);
  return template ? structuredClone(template) : null;
}

export function getTemplateVersion(
  templateId: string,
  versionId: string,
): TemplateVersion | null {
  const template = getTemplate(templateId);

  if (!template) {
    return null;
  }

  return template.versions.find((version) => version.id === versionId) ?? null;
}

export function getPublishedTemplateVersion(
  templateId: string,
): TemplateVersion | null {
  const template = getTemplate(templateId);

  if (!template?.activeVersionId) {
    return null;
  }

  const version = template.versions.find(
    (item) => item.id === template.activeVersionId,
  );

  return version?.status === 'published' ? version : null;
}

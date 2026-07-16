import type { FieldMapping, TemplateVersion } from './template-schema';

export type PdfPageMetrics = {
  width: number;
  height: number;
};

export type SaveDraftPayload = {
  templateId: string;
  baseVersionId: string;
  changeNote: string;
  fieldMappings: FieldMapping[];
};

export type SaveDraftResult =
  | { ok: true; draftId: string; draftNumber: number }
  | { ok: false; error: string };

export type MapperPageData = {
  templateId: string;
  version: TemplateVersion;
  pdfUrl: string;
};

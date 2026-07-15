/**
 * POST /api/generate-doc
 * Body: { applicationId: string, templateType: 'form1' | 'form2' | 'form3' }
 * Response: .docx binary stream
 *
 * Author: PE (Perplexity) — Sprint 4
 * Requires: public/templates/form1.docx, form2.docx, form3.docx
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { prisma } from '@/lib/prisma';
import { mapDocument, type TemplateType } from '@/lib/documentMapper';

const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'templates');

const TEMPLATE_FILES: Record<TemplateType, string> = {
  form1: 'form1.docx', // 脱退一時金請求書
  form2: 'form2.docx', // 委任状
  form3: 'form3.docx', // 納税管理人届出書
};

const OUTPUT_NAMES: Record<TemplateType, string> = {
  form1: '\u8131\u9000\u4e00\u6642\u91d1\u8acb\u6c42\u66f8.docx',
  form2: '\u59d4\u4efb\u72b6.docx',
  form3: '\u7d0d\u7a0e\u7ba1\u7406\u4eba\u5c4a\u51fa\u66f8.docx',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { applicationId?: string; templateType?: string };
    const { applicationId, templateType } = body;

    // --- Validation ---
    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }
    if (!templateType || !['form1', 'form2', 'form3'].includes(templateType)) {
      return NextResponse.json(
        { error: 'templateType must be form1 | form2 | form3' },
        { status: 400 },
      );
    }

    const tmplType = templateType as TemplateType;

    // --- Check template file exists ---
    const templatePath = path.join(TEMPLATE_DIR, TEMPLATE_FILES[tmplType]);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: `Template file not found: ${TEMPLATE_FILES[tmplType]}. Please upload .docx templates to public/templates/` },
        { status: 503 },
      );
    }

    // --- Fetch data from DB ---
    const application = await prisma.nenkinApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        workHistories: { orderBy: { startDate: 'asc' } },
        taxOffice: true,
        taxRepresentative: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // --- Map data ---
    const tags = mapDocument(
      {
        application,
        customer:           application.customer,
        workHistories:      application.workHistories,
        taxOffice:          application.taxOffice,
        taxRepresentative:  application.taxRepresentative,
      },
      tmplType,
    );

    // --- Render docx ---
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Throw on missing tag to surface mapping errors early
      nullGetter: () => '',
    });

    doc.render(tags);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const filename = encodeURIComponent(OUTPUT_NAMES[tmplType]);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Content-Length': String(buffer.byteLength),
      },
    });

  } catch (err) {
    console.error('[generate-doc] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapApplicationToTemplate } from '@/lib/documentMapper';
import { fillPdfTemplate, PdfMappingConfig } from '@/lib/pdfGenerator';
import fs from 'fs';
import path from 'path';
import { requireApplicationAccess } from '@/lib/auth/authorization';
import { getRequiredTags } from '@/features/templates/template-field-catalog';

export async function GET(
  request: NextRequest
) {
  try {
    const id = request.nextUrl.pathname.split('/')[3];
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;

    const searchParams = request.nextUrl.searchParams;
    const templateName = searchParams.get('template'); // e.g. don_xin_lan_1

    if (!templateName) {
      return NextResponse.json({ success: false, error: 'Missing template parameter' }, { status: 400 });
    }

    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: { include: { taxOffice: true, workHistories: true } },
        taxRepresentative: true,
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // 1. Prepare data
    const templateData: Record<string, string> = {};
    const mapperInstance = {
      result: templateData,
      splitStr: (str: string | null | undefined, prefix: string, maxLength?: number) => {
        if (!str) return;
        const cleanStr = str.replace(/\s+/g, '');
        const chars = Array.from(cleanStr);
        const len = maxLength || chars.length;
        for (let i = 0; i < len; i++) {
          if (i < chars.length) {
            templateData[`${prefix}_${i + 1}`] = chars[i];
          } else {
            templateData[`${prefix}_${i + 1}`] = '';
          }
        }
      },
      splitStrKeepSpace: (str: string | null | undefined, prefix: string, maxLength?: number) => {
        if (!str) return;
        const chars = Array.from(str);
        const len = Math.max(maxLength || 0, chars.length);
        for (let i = 0; i < len; i++) {
          if (i < chars.length) {
            templateData[`${prefix}_${i + 1}`] = chars[i];
          } else {
            templateData[`${prefix}_${i + 1}`] = '';
          }
        }
      }
    };

    // Note: We're reusing the logic from documentMapper, but documentMapper mutates an internal `result`.
    // It's better to modify documentMapper to return the object, or call it if it does.
    // wait, documentMapper.ts exports `mapApplicationToTemplate` but wait, how is it designed?
    // Let me check if it returns the result object.
    
    // I will call mapApplicationToTemplate, assuming it returns the Record<string, string>.
    // Let's import it and use it.
    // Wait, in my previous view_file, mapApplicationToTemplate was defined as:
    // export function mapApplicationToTemplate(application: ApplicationWithRelations) {
    //   const result: Record<string, string> = {}; ...
    //   return result;
    // }
    const finalData = mapApplicationToTemplate(application as any);

    // 2. Load Coordinate Config
    const configPath = path.join(process.cwd(), 'public', 'templates', `${templateName}.json`);
    let config: PdfMappingConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } catch (e) {
        console.warn(`Error parsing config for ${templateName}:`, e);
      }
    } else {
      console.warn(`Config file ${templateName}.json not found. Generating PDF without mapping.`);
    }

    // Validation Check
    const requiredTags = getRequiredTags(templateName);
    const missingDataFields: string[] = [];
    const missingMappingFields: string[] = [];

    for (const tag of requiredTags) {
      if (!(tag.id in config)) {
        missingMappingFields.push(tag.label);
      }
      
      const val = finalData[tag.id];
      if (val === undefined || val === null || val === '') {
        missingDataFields.push(tag.label);
      }
    }

    if (missingMappingFields.length > 0 || missingDataFields.length > 0) {
      const errParts = [];
      if (missingMappingFields.length > 0) errParts.push(`Chưa ghim tọa độ: ${missingMappingFields.join(', ')}`);
      if (missingDataFields.length > 0) errParts.push(`Thiếu dữ liệu nguồn: ${missingDataFields.join(', ')}`);
      return NextResponse.json({ success: false, error: errParts.join(' | ') }, { status: 400 });
    }

    // 3. Generate PDF
    const pdfBytes = await fillPdfTemplate(`${templateName}.pdf`, finalData || {}, config);

    // 4. Return as Response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${templateName}_${id.substring(0,8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

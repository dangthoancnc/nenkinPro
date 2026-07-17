import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapDocument } from '@/lib/documentMapper';
import { fillPdfTemplate } from '@/lib/pdfGenerator';
import { getRequiredTags } from '@/features/templates/template-field-catalog';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, templateType } = body;

    if (!applicationId || !templateType) {
      return NextResponse.json({ error: 'Missing applicationId or templateType' }, { status: 400 });
    }

    const application = await prisma.nenkinApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            taxOffice: true
          }
        },
        taxRepresentative: true,
      }
    });

    if (!application || !application.customer) {
      return NextResponse.json({ error: 'Application or Customer not found' }, { status: 404 });
    }

    const workHistories = await prisma.workHistory.findMany({
      where: { customerId: application.customerId },
      orderBy: { startDate: 'asc' }
    });

    const mapperInput = {
      application,
      customer: application.customer,
      workHistories,
      taxOffice: application.customer.taxOffice,
      taxRepresentative: application.taxRepresentative,
    };

    let mappedData: Record<string, string> = {};
    let config = {};
    let pdfTemplateName = '';
    let outputFilename = '';

    try {
      mappedData = mapDocument(mapperInput, templateType);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (templateType === 'don_xin_lan_1') {
      pdfTemplateName = 'don_xin_lan_1.pdf';
      outputFilename = `DatTaiNenkin_${application.customer.code}.pdf`;
    } else if (templateType === 'ininjyo_yoshiki_lan_1') {
      pdfTemplateName = 'ininjyo_yoshiki_lan_1.pdf';
      outputFilename = `UyQuyen_${application.customer.code}.pdf`;
    } else if (templateType === 'nouzeikanrinin') {
      pdfTemplateName = 'nouzeikanrinin.pdf'; // 納税管理人届出書
      outputFilename = `NguoiDaiDienThue_${application.customer.code}.pdf`;
    } else if (templateType === 'bang_1_2') {
      pdfTemplateName = 'bang_1_2.pdf';
      outputFilename = `Bang_1_2_${application.customer.code}.pdf`;
    } else if (templateType === 'bang_3') {
      pdfTemplateName = 'bang_3.pdf';
      outputFilename = `Bang_3_${application.customer.code}.pdf`;
    } else if (templateType === 'giay_uy_thac_lan_2') {
      pdfTemplateName = 'giay_uy_thac_lan_2.pdf';
      outputFilename = `GiayUyThacLan2_${application.customer.code}.pdf`;
    } else {
      return NextResponse.json({ error: 'Invalid templateType' }, { status: 400 });
    }

    try {
      const configPath = path.join(process.cwd(), 'public', 'templates', `${templateType}.json`);
      const configFile = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configFile);
    } catch (err: any) {
      console.warn(`Could not load config for ${templateType}:`, err.message);
      config = {};
    }

    // Validation Check
    const requiredTags = getRequiredTags(templateType, mappedData);
    const missingDataFields: string[] = [];
    const missingMappingFields: string[] = [];

    for (const tag of requiredTags) {
      if (!(tag.id in config)) {
        missingMappingFields.push(tag.label);
      }
      
      const val = mappedData[tag.id];
      if (val === undefined || val === null || val === '') {
        missingDataFields.push(tag.label);
      }
    }

    if (missingMappingFields.length > 0 || missingDataFields.length > 0) {
      const errParts = [];
      if (missingMappingFields.length > 0) errParts.push(`Chưa ghim tọa độ: ${missingMappingFields.join(', ')}`);
      if (missingDataFields.length > 0) errParts.push(`Thiếu dữ liệu nguồn: ${missingDataFields.join(', ')}`);
      return NextResponse.json({ error: errParts.join(' | ') }, { status: 400 });
    }

    // Generate PDF Binary
    const pdfBytes = await fillPdfTemplate(pdfTemplateName, mappedData, config as any);

    // Return as downloadable file
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${outputFilename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

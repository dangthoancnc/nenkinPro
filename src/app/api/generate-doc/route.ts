import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapDocument } from '@/lib/documentMapper';
import { fillPdfTemplate } from '@/lib/pdfGenerator';
import { FORM1_COORDINATES } from '@/lib/configs/form1_config';
import { FORM2_COORDINATES } from '@/lib/configs/form2_config';
import { FORM3_COORDINATES } from '@/lib/configs/form3_config';

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

    if (templateType === 'form1') {
      config = FORM1_COORDINATES;
      pdfTemplateName = 'don_xin_lan1.pdf'; // Use the unencrypted PDF in public/forms/ (wait, is it don_xin_lan1.pdf? Yes, 07.pdf had encryption issues, so we can use don_xin_lan1.pdf which was added to public/forms or copy it there)
      outputFilename = `DatTaiNenkin_${application.customer.code}.pdf`;
    } else if (templateType === 'form2') {
      config = FORM2_COORDINATES;
      pdfTemplateName = 'ininjyorei.pdf'; // 委任状
      outputFilename = `UyQuyen_${application.customer.code}.pdf`;
    } else if (templateType === 'form3') {
      config = FORM3_COORDINATES;
      pdfTemplateName = 'nouzeikanrinin.pdf'; // 納税管理人届出書
      outputFilename = `NguoiDaiDienThue_${application.customer.code}.pdf`;
    } else {
      return NextResponse.json({ error: 'Invalid templateType' }, { status: 400 });
    }

    // Generate PDF Binary
    const pdfBytes = await fillPdfTemplate(pdfTemplateName, mappedData, config);

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

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapDocument, TemplateType } from '@/lib/documentMapper';
import { fillPdfTemplate, PdfMappingConfig } from '@/lib/pdfGenerator';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { requireApplicationAccess } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get('stage') || 'all'; // '1' | '2' | 'all'

    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: { include: { taxOffice: true, bankAccounts: true } },
        taxRepresentative: true,
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ' }, { status: 404 });
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

    let templatesToProcess: { template: TemplateType; file: string }[] = [];

    if (stage === '1') {
      templatesToProcess = [
        { template: 'don_xin_lan_1', file: 'don_xin_lan_1.pdf' },
        { template: 'ininjyo_yoshiki_lan_1', file: 'ininjyo_yoshiki_lan_1.pdf' },
      ];
    } else if (stage === '2') {
      templatesToProcess = [
        { template: 'nouzeikanrinin', file: 'nouzeikanrinin.pdf' },
        { template: 'bang_1_2', file: 'bang_1_2.pdf' },
        { template: 'bang_3', file: 'bang_3.pdf' },
      ];
    } else {
      templatesToProcess = [
        { template: 'don_xin_lan_1', file: 'don_xin_lan_1.pdf' },
        { template: 'ininjyo_yoshiki_lan_1', file: 'ininjyo_yoshiki_lan_1.pdf' },
        { template: 'nouzeikanrinin', file: 'nouzeikanrinin.pdf' },
        { template: 'bang_1_2', file: 'bang_1_2.pdf' },
        { template: 'bang_3', file: 'bang_3.pdf' },
      ];
    }

    const mergedPdf = await PDFDocument.create();

    for (const item of templatesToProcess) {
      try {
        const data = mapDocument(mapperInput, item.template);
        const configPath = path.join(process.cwd(), 'public', 'templates', `${item.template}.json`);
        let config: PdfMappingConfig = {};
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }

        const pdfBytes = await fillPdfTemplate(item.file, data, config);
        const doc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      } catch (e) {
        console.warn(`Error compiling page ${item.template}:`, e);
      }
    }

    const finalPdfBytes = await mergedPdf.save();
    const customerName = (application.customer.fullName || 'HoSo').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const stageLabel = stage === '1' ? 'Lan1' : stage === '2' ? 'Lan2' : 'TronBo';

    return new NextResponse(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="HoSoNenkin_${customerName}_${stageLabel}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating bundle PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapDocument, TemplateType } from '@/lib/documentMapper';
import { generateBundlePdf, PdfMappingConfig } from '@/lib/pdfGenerator';
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
    const stageParam = (searchParams.get('stage') || 'all').toLowerCase();
    const isStage1 = stageParam === '1' || stageParam === 'stage_1' || stageParam === 'lan1';
    const isStage2 = stageParam === '2' || stageParam === 'stage_2' || stageParam === 'lan2';

    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: { include: { taxOffice: true, bankAccounts: true } },
        taxRepresentative: {
          include: { bankAccounts: { orderBy: { isDefault: 'desc' } } }
        },
        taxRepBankAccount: true,
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

    if (isStage1) {
      templatesToProcess = [
        { template: 'don_xin_lan_1', file: 'don_xin_lan_1.pdf' },
        { template: 'ininjyo_yoshiki_lan_1', file: 'ininjyo_yoshiki_lan_1.pdf' },
      ];
    } else if (isStage2) {
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

    const bundleItems = templatesToProcess.map((item) => {
      const data = mapDocument(mapperInput, item.template);
      const configPath = path.join(process.cwd(), 'public', 'templates', `${item.template}.json`);
      let config: PdfMappingConfig = {};
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch {
          config = {};
        }
      }
      return {
        template: item.template,
        file: item.file,
        data,
        config,
      };
    });

    const finalPdfBytes = await generateBundlePdf(bundleItems);
    const customerName = (application.customer.fullName || 'HoSo').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const stageLabel = isStage1 ? 'Lan1' : isStage2 ? 'Lan2' : 'TronBo';

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

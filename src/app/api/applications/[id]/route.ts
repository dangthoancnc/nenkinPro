import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mapDocument, mapApplicationToTemplate, TemplateType } from '@/lib/documentMapper';
import { requireApplicationAccess } from '@/lib/auth/authorization';
import { updateApplicationStatus } from '@/lib/services/applicationService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;
    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { taxOffice: true }
        },
        taxRepresentative: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
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

    const templates: TemplateType[] = ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1', 'nouzeikanrinin', 'bang_1_2', 'bang_3', 'giay_uy_thac_lan_2'];
    let mappedData: Record<string, string> = {};
    
    // Fallback legacy compatibility mapping first
    try {
      mappedData = { ...mapApplicationToTemplate(application) };
    } catch (e) {
      // ignore
    }

    // Merge advanced mapping for all forms
    for (const t of templates) {
      try {
        const data = mapDocument(mapperInput, t);
        mappedData = { ...mappedData, ...data };
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ ...application, mappedData });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;
    const body = await request.json();
    const { status, revisionNote, ...payload } = body;
    
    let updatedApplication;
    if (status) {
      updatedApplication = await updateApplicationStatus(id, status, user.id, payload, revisionNote);
    } else {
      updatedApplication = await prisma.nenkinApplication.update({
        where: { id },
        data: body,
      });
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error } = await requireApplicationAccess(id);
    if (error || !user) return error;

    // Find application and customer with bank accounts
    const application = await prisma.nenkinApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            bankAccounts: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const customer = application.customer;
    if (customer) {
      // Gather all image URLs
      const urls: string[] = [];
      if (customer.zairyuFrontUrl) urls.push(customer.zairyuFrontUrl);
      if (customer.zairyuBackUrl) urls.push(customer.zairyuBackUrl);
      if (customer.passportUrl) urls.push(customer.passportUrl);
      if (customer.nenkinBookUrl) urls.push(customer.nenkinBookUrl);
      if (customer.departureStampUrl) urls.push(customer.departureStampUrl);
      
      if (customer.bankAccounts) {
        for (const bank of customer.bankAccounts) {
          if (bank.bankPassbookUrls && Array.isArray(bank.bankPassbookUrls)) {
            urls.push(...bank.bankPassbookUrls);
          }
        }
      }

      // Convert URLs to Supabase storage paths
      const paths = urls
        .map(url => {
          const searchStr = '/public/customer-documents/';
          const idx = url.indexOf(searchStr);
          return idx !== -1 ? url.substring(idx + searchStr.length) : null;
        })
        .filter((path): path is string => !!path);

      // Remove from Supabase Storage
      if (paths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('customer-documents')
          .remove(paths);
        if (storageError) {
          console.error('Failed to delete files from Supabase Storage:', storageError);
        }
      }

      // Delete customer (Cascades to NenkinApplication and other tables)
      await prisma.customer.delete({
        where: { id: customer.id }
      });
    } else {
      // Fallback if application has no customer record
      await prisma.nenkinApplication.delete({
        where: { id }
      });
    }

    return NextResponse.json({ message: 'Application, customer, and files deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


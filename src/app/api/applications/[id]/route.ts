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
    let application: any = null;
    try {
      application = await prisma.nenkinApplication.findUnique({
        where: { id },
        include: {
          customer: {
            include: { taxOffice: true, bankAccounts: true, workHistories: { orderBy: { startDate: 'asc' } }, ocrResults: true }
          },
          taxRepresentative: {
            include: { bankAccounts: { orderBy: { isDefault: 'desc' } } }
          },
          taxRepBankAccount: true,
          assignedUser: { select: { id: true, name: true, email: true, role: true, staffCode: true } },
          collaborator: { select: { id: true, name: true, email: true, role: true, staffCode: true } },
        },
      });
    } catch (findErr: any) {
      if (findErr?.message?.includes('collaborator')) {
        application = await prisma.nenkinApplication.findUnique({
          where: { id },
          include: {
            customer: {
              include: { taxOffice: true, bankAccounts: true, workHistories: { orderBy: { startDate: 'asc' } }, ocrResults: true }
            },
            taxRepresentative: {
              include: { bankAccounts: { orderBy: { isDefault: 'desc' } } }
            },
            taxRepBankAccount: true,
            assignedUser: { select: { id: true, name: true, email: true, role: true, staffCode: true } },
          },
        });
        if (application) {
          try {
            const rawCollab: any[] = await prisma.$queryRawUnsafe(
              `SELECT u.id, u.name, u.email, u.role, u."staffCode"
               FROM "nenkin_applications" a
               JOIN "nenkin_users" u ON a."collaboratorId" = u.id
               WHERE a.id = $1 LIMIT 1`,
              application.id
            );
            application.collaborator = rawCollab[0] || null;
          } catch {
            application.collaborator = null;
          }
        }
      } else {
        throw findErr;
      }
    }

    if (!application) {
      // Fallback: check if 'id' is customerId or customerCode
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { id },
            { code: id }
          ]
        },
        include: {
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              taxRepresentative: {
                include: { bankAccounts: { orderBy: { isDefault: 'desc' } } }
              },
              taxRepBankAccount: true
            }
          },
          taxOffice: true,
          workHistories: { orderBy: { startDate: 'asc' } },
          ocrResults: true
        }
      });

      if (customer) {
        if (customer.applications.length > 0) {
          const app = customer.applications[0];
          application = {
            ...app,
            customer,
            taxRepresentative: app.taxRepresentative,
            taxRepBankAccount: (app as any).taxRepBankAccount
          } as any;
        } else {
          // Auto-create a draft application for existing customer so staff can manage it
          const newApp = await prisma.nenkinApplication.create({
            data: {
              customerId: customer.id,
              status: 'DRAFT'
            },
            include: {
              customer: {
                include: { taxOffice: true }
              },
              taxRepresentative: {
                include: { bankAccounts: { orderBy: { isDefault: 'desc' } } }
              },
              taxRepBankAccount: true
            }
          });
          application = newApp as any;
        }
      }
    }

    if (!application) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const workHistories = await prisma.workHistory.findMany({
      where: { customerId: application.customerId },
      orderBy: { startDate: 'asc' }
    });

    let taxRep = application.taxRepresentative;
    if (!taxRep) {
      taxRep = await prisma.taxRepresentative.findFirst({
        include: { bankAccounts: { orderBy: { isDefault: 'desc' } } },
        orderBy: { createdAt: 'desc' }
      });
    }

    const mapperInput = {
      application,
      customer: application.customer,
      workHistories,
      taxOffice: application.customer.taxOffice,
      taxRepresentative: taxRep,
    };

    const templates: TemplateType[] = ['don_xin_lan_1', 'ininjyo_yoshiki_lan_1', 'nouzeikanrinin', 'bang_1_2', 'bang_3'];
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
    const dateFields = ['noticeDate', 'applyDate', 'sent1stDate', 'received1stDate', 'sent2ndDate', 'received2ndDate', 'exchangeRateDate'];
    const formattedData: Record<string, any> = {};
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined) {
        if (dateFields.includes(key)) {
          formattedData[key] = payload[key] ? new Date(payload[key]) : null;
        } else {
          formattedData[key] = payload[key];
        }
      }
    });

    if ('assignedUserId' in formattedData) {
      formattedData.assignedUserId = formattedData.assignedUserId || null;
      formattedData.assignedAt = formattedData.assignedUserId ? new Date() : null;
    }

    if ('collaboratorId' in formattedData) {
      formattedData.collaboratorId = formattedData.collaboratorId || null;
    }

    let updatedApplication: any;
    try {
      if (status) {
        updatedApplication = await updateApplicationStatus(id, status, user.id, formattedData, revisionNote);
      } else {
        updatedApplication = await prisma.nenkinApplication.update({
          where: { id },
          data: formattedData,
          include: {
            collaborator: { select: { id: true, name: true, staffCode: true, role: true } },
            assignedUser: { select: { id: true, name: true, staffCode: true, role: true } }
          }
        });
      }
    } catch (err: any) {
      if (
        (err?.message?.includes('exchangeRateDate') || err?.message?.includes('collaboratorId') || err?.message?.includes('Unknown argument'))
      ) {
        console.warn('Prisma client in memory is outdated. Falling back to resilient update...');
        const { exchangeRateDate, collaboratorId, ...restData } = formattedData;
        if (status) {
          updatedApplication = await updateApplicationStatus(id, status, user.id, restData, revisionNote);
        } else {
          updatedApplication = await prisma.nenkinApplication.update({
            where: { id },
            data: restData,
          });
        }
        if (exchangeRateDate !== undefined) {
          await prisma.$executeRawUnsafe(
            `UPDATE "NenkinApplication" SET "exchangeRateDate" = $1 WHERE "id" = $2`,
            exchangeRateDate,
            id
          );
          if (updatedApplication) {
            updatedApplication.exchangeRateDate = exchangeRateDate;
          }
        }
        if (collaboratorId !== undefined) {
          await prisma.$executeRawUnsafe(
            `UPDATE "NenkinApplication" SET "collaboratorId" = $1 WHERE "id" = $2`,
            collaboratorId,
            id
          );
          if (updatedApplication) {
            updatedApplication.collaboratorId = collaboratorId;
          }
        }
      } else {
        throw err;
      }
    }

    return NextResponse.json(updatedApplication);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
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
      // Delete complete customer folder from Supabase Storage (prevents orphan files/folders)
      const { deleteCustomerFolder } = await import('@/lib/storageHelper');
      await deleteCustomerFolder(customer.id).catch(console.error);

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


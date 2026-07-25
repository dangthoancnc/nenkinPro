import { NextResponse } from 'next/server';
import { validateEmployee } from '../serverAuth';
import prisma from '../prisma';
import { User, Customer, NenkinApplication } from '@prisma/client';

export type AuthResult = {
  user?: User;
  error?: NextResponse;
};

export type CustomerAuthResult = AuthResult & {
  customer?: Customer;
};

export type ApplicationAuthResult = AuthResult & {
  application?: NenkinApplication;
  customer?: Customer;
};

export async function requireStaff(): Promise<AuthResult> {
  const user = await validateEmployee();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user };
}

export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const { user, error } = await requireStaff();
  if (error || !user) return { error };

  if (!allowedRoles.includes(user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
}

export async function requireCustomerAccess(customerId: string): Promise<CustomerAuthResult> {
  const { user, error } = await requireStaff();
  if (error || !user) return { error };

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }

  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    return { user, customer };
  }

  if (customer.createdById !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, customer };
}

export async function requireApplicationAccess(id: string): Promise<ApplicationAuthResult> {
  const { user, error } = await requireStaff();
  if (error || !user) return { error };

  let application = await prisma.nenkinApplication.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!application) {
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
          take: 1
        }
      }
    });

    if (customer) {
      if (customer.applications.length > 0) {
        const app = customer.applications[0];
        application = { ...app, customer };
      } else {
        const newApp = await prisma.nenkinApplication.create({
          data: {
            customerId: customer.id,
            status: 'DRAFT'
          },
          include: { customer: true }
        });
        application = newApp;
      }
    }
  }

  if (!application) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }

  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    return { user, application, customer: application.customer };
  }

  if (application.customer.createdById && application.customer.createdById !== user.id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, application, customer: application.customer };
}

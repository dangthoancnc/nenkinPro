import prisma from '@/lib/prisma';
import { EntityType, ApplicationStatus } from '@prisma/client';
import * as schemas from '@/lib/validations/applicationSchema';

export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  actionBy: string,
  payload: any,
  revisionNote?: string
) {
  // Retrieve current app with customer
  const currentApp = await prisma.nenkinApplication.findUnique({
    where: { id },
    include: { customer: true }
  });

  if (!currentApp) {
    throw new Error('Application not found');
  }

  const oldStatus = currentApp.status;
  if (oldStatus === newStatus) {
    // If status is the same, we just update the payload without guard clauses for transition
    return await prisma.nenkinApplication.update({
      where: { id },
      data: payload
    });
  }

  // Combine payload with current data for validation
  const validationData = {
    ...currentApp.customer,
    ...currentApp,
    ...payload,
  };

  // Bypass strict Zod validation on updates to allow saving in any state as requested by the user.
  // Validation is now managed by visual verification workflow instead of strict blocking on save.

  // Use transaction to update and audit
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.nenkinApplication.update({
      where: { id },
      data: {
        ...payload,
        status: newStatus,
        revisionNote: revisionNote || payload.revisionNote,
      }
    });

    await tx.auditLog.create({
      data: {
        entityId: id,
        entityType: EntityType.APPLICATION,
        fromState: oldStatus,
        toState: newStatus,
        actionBy: actionBy,
        metadata: {
          revisionNote: revisionNote || payload.revisionNote,
          payloadKeys: Object.keys(payload)
        }
      }
    });

    return updated;
  });
}

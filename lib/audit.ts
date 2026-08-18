import { prisma } from '@/lib/db';

interface AuditLogParams {
  userId?: string;
  organizationId?: string;
  eventId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      organizationId: params.organizationId,
      eventId: params.eventId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: (params.metadata ?? {}) as object,
    },
  });
}



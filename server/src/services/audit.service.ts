import { PrismaClient } from "@prisma/client";

export async function logAuditAction(
  prisma: PrismaClient,
  params: {
    action: string;
    actorId?: string;
    targetType: string;
    targetId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }
) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId || null,
        targetType: params.targetType,
        targetId: params.targetId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null
      }
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}


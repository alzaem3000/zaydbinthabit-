import { db } from "../db";
import { auditLogs } from "@shared/schema";

export class AuditService {
  static async log(data: { userId: string; action: string; entityType: string; entityId?: string; details?: any; ipAddress?: string; }) {
    try {
      await db.insert(auditLogs).values({
        ...data,
        details: data.details ? JSON.stringify(data.details) : null,
      });
    } catch (error) {
      console.error("Audit Log Failure:", error);
    }
  }
}

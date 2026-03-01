import { db } from "../db";
import { notifications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class NotificationService {
  static async send(data: { recipientId: string; type: "info" | "success" | "warning" | "error"; title: string; message: string; link?: string; }) {
    try {
      await db.insert(notifications).values(data);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  static async getUserNotifications(userId: string, limit = 20) {
    return await db.query.notifications.findMany({
      where: eq(notifications.recipientId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: limit,
    });
  }

  static async markAsRead(notificationId: number) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
  }
}

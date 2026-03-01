import { db } from "../db";
import { academicCycles } from "@shared/schema";
import { eq } from "drizzle-orm";

export class CycleService {
  static async getActiveCycle() {
    const cycle = await db.query.academicCycles.findFirst({
      where: eq(academicCycles.isActive, true)
    });
    
    if (!cycle) {
      // Auto-initialize first cycle if none exists
      const [newCycle] = await db.insert(academicCycles).values({
        name: "العام الدراسي الحالي",
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        isLocked: false
      }).returning();
      return newCycle;
    }
    return cycle;
  }

  static async getAllCycles() {
    return await db.query.academicCycles.findMany();
  }

  static async setActiveCycle(id: number) {
    await db.transaction(async (tx) => {
      // Deactivate all cycles
      await tx.update(academicCycles).set({ isActive: false });
      // Activate the selected one
      await tx.update(academicCycles).set({ isActive: true }).where(eq(academicCycles.id, id));
    });
  }
}

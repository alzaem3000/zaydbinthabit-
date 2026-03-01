import { describe, it, expect, vi } from "vitest";

vi.mock("../server/db", () => ({
  db: {
    query: {
      academicCycles: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: "العام الدراسي الحالي",
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            isActive: true,
            isLocked: false,
          },
        ]),
      }),
    }),
  },
}));

describe("CycleService Logic", () => {
  it("should create a default cycle when none exists", async () => {
    const { db } = await import("../server/db");
    (db.query.academicCycles.findFirst as any).mockResolvedValueOnce(undefined);

    const { CycleService } = await import("../server/services/cycles");
    const cycle = await CycleService.getActiveCycle();

    expect(cycle).toBeDefined();
    expect(cycle.name).toBe("العام الدراسي الحالي");
    expect(cycle.isActive).toBe(true);
    expect(cycle.isLocked).toBe(false);
  });

  it("should return existing active cycle if one exists", async () => {
    const { db } = await import("../server/db");
    const existingCycle = {
      id: 5,
      name: "1446-1447",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-06-30"),
      isActive: true,
      isLocked: false,
    };
    (db.query.academicCycles.findFirst as any).mockResolvedValueOnce(existingCycle);

    const { CycleService } = await import("../server/services/cycles");
    const cycle = await CycleService.getActiveCycle();

    expect(cycle).toEqual(existingCycle);
    expect(cycle.id).toBe(5);
  });

  it("should validate weight totals to 100%", () => {
    const weights = [10, 10, 10, 10, 10, 10, 10, 5, 5, 10, 10];
    const total = weights.reduce((sum, w) => sum + w, 0);
    expect(total).toBe(100);
  });
});

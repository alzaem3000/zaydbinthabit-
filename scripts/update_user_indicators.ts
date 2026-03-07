import { db } from "../server/db";
import { indicators, criteria, performanceStandards, users, academicCycles } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { PERFORMANCE_STANDARDS_FALLBACK } from "../client/src/lib/constants";
import { CycleService } from "../server/services/cycles";

async function main() {
    console.log("Updating existing indicators for all teachers...");

    try {
        const activeCycle = await CycleService.getActiveCycle();
        const teachers = await db.select().from(users).where(eq(users.role, "teacher"));

        for (const teacher of teachers) {
            console.log(`Processing teacher: ${teacher.firstName} ${teacher.lastName} (ID: ${teacher.id})`);

            // Get current indicators for this teacher
            const userIndicators = await db.select().from(indicators).where(
                and(
                    eq(indicators.userId, teacher.id),
                    eq(indicators.academicCycleId, activeCycle.id)
                )
            );

            for (let i = 0; i < PERFORMANCE_STANDARDS_FALLBACK.length; i++) {
                const standard = PERFORMANCE_STANDARDS_FALLBACK[i];
                const standardId = standard.id;

                // Try to find an existing indicator that matches this standard by title (old or new)
                let existingIndicator = userIndicators.find(ind =>
                    ind.performanceStandardId === standardId ||
                    ind.title === standard.title
                );

                // If not found by exact title, try some common old titles
                if (!existingIndicator) {
                    const oldTitlesMap: Record<string, string> = {
                        "التنويع في استراتيجيات التدريس": "استراتيجيات التدريس",
                        "توظيف تقنيات التعلم": "توظيف تقنيات ووسائل التعلم المناسبة",
                        "تحليل نتائج المتعلمين": "تحليل نتائج المتعلمين وتشخيص مستوياتهم",
                        "إعداد وتنفيذ خطة التعلم": "إعداد وتنفيذ خطط التعلم"
                    };

                    const oldTitle = oldTitlesMap[standard.title];
                    if (oldTitle) {
                        existingIndicator = userIndicators.find(ind => ind.title === oldTitle);
                    }
                }

                if (existingIndicator) {
                    console.log(`  Updating indicator "${existingIndicator.title}" to "${standard.title}"`);
                    await db.update(indicators)
                        .set({
                            title: standard.title,
                            description: standard.description,
                            weight: parseInt(standard.weight),
                            performanceStandardId: standardId,
                            order: i + 1,
                            updatedAt: new Date()
                        })
                        .where(eq(indicators.id, existingIndicator.id));
                } else {
                    console.log(`  Creating missing indicator: "${standard.title}"`);
                    const [newIndicator] = await db.insert(indicators).values({
                        title: standard.title,
                        description: standard.description,
                        status: "pending",
                        witnessCount: 0,
                        userId: teacher.id,
                        order: i + 1,
                        weight: parseInt(standard.weight),
                        performanceStandardId: standardId,
                        academicCycleId: activeCycle.id
                    } as any).returning();

                    // Add default criteria
                    for (let j = 0; j < standard.suggestedEvidence.length; j++) {
                        await db.insert(criteria).values({
                            indicatorId: newIndicator.id,
                            title: standard.suggestedEvidence[j],
                            isCompleted: false,
                            order: j + 1
                        });
                    }
                }
            }
        }

        console.log("Successfully updated all indicators!");
    } catch (error) {
        console.error("Error updating indicators:", error);
    } finally {
        process.exit(0);
    }
}

main();

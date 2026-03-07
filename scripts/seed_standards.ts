import { db } from "../server/db";
import { performanceStandards } from "../shared/schema";
import { PERFORMANCE_STANDARDS_FALLBACK } from "../client/src/lib/constants";

async function main() {
    console.log("Seeding performance standards...");
    try {
        for (const standard of PERFORMANCE_STANDARDS_FALLBACK) {
            // Extract icon name from function name or object name
            let iconName = "CheckCircle";
            if (standard.icon && standard.icon.displayName) {
                iconName = standard.icon.displayName;
            } else if (standard.icon && standard.icon.name) {
                iconName = standard.icon.name;
            }

            await db.insert(performanceStandards).values({
                id: standard.id,
                title: standard.title,
                weight: standard.weight,
                description: standard.description,
                suggestedEvidence: standard.suggestedEvidence,
                icon: iconName,
                order: standard.id,
            }).onConflictDoUpdate({
                target: performanceStandards.id,
                set: {
                    title: standard.title,
                    weight: standard.weight,
                    description: standard.description,
                    suggestedEvidence: standard.suggestedEvidence,
                    icon: iconName,
                    order: standard.id,
                }
            });
        }
        console.log("Successfully seeded performance standards!");
    } catch (error) {
        console.error("Error seeding performance standards:", error);
    } finally {
        process.exit(0);
    }
}

main();

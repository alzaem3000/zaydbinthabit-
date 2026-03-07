import { db } from '../server/db';
import { performanceStandards } from '../shared/schema';

async function main() {
    try {
        const standards = await db.select().from(performanceStandards);
        console.log("Performance Standards in DB:");
        console.log(JSON.stringify(standards, null, 2));
    } catch (err) {
        console.error("Error connecting to DB or fetching:", err);
    } finally {
        process.exit(0);
    }
}
main();

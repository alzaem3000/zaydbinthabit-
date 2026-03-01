import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addMissingColumns() {
    console.log("Adding missing columns to users table...");
    try {
        await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS national_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS mobile_number TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS full_name_arabic TEXT,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR;
    `);
        console.log("Successfully added missing columns to users table.");
        process.exit(0);
    } catch (err) {
        console.error("Error adding columns:", err);
        process.exit(1);
    }
}

addMissingColumns();

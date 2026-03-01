import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createSurveyTables() {
    console.log("Creating survey tables...");

    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS surveys (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_published BOOLEAN NOT NULL DEFAULT false,
        share_token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_questions (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        question_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        is_required BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        logic JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        respondent_id TEXT,
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

        console.log("Survey tables created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error creating tables:", err);
        process.exit(1);
    }
}

createSurveyTables();

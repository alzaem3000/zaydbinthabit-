import { Client } from 'pg';

const dbUrl = process.env.DATABASE_URL;

async function resetSchema() {
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log("Connected to DB, attempting to drop public schema...");

        // Try to drop and recreate public schema
        await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);

        console.log("Successfully recreated public schema!");
    } catch (e: any) {
        console.log("Failed to reset schema:");
        console.error(e.message);
    } finally {
        await client.end();
    }
}

resetSchema();

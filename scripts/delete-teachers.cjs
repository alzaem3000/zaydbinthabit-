const { Client } = require('pg');

async function run() {
    const url = "postgresql://neondb_owner:npg_Cinp6Qm7ePZS@ep-curly-poetry-ai1sga58-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
    const client = new Client(url);
    try {
        await client.connect();
        console.log("Connected to Neon DB. Deleting test teacher accounts...");

        // This will delete teachers and cascade to records they own
        const res = await client.query("DELETE FROM users WHERE role = 'teacher';");
        console.log(`Successfully deleted ${res.rowCount} teacher account(s) and all their associated data.`);
    } catch (err) {
        console.error("Error connecting or deleting:", err);
    } finally {
        await client.end();
    }
}

run();

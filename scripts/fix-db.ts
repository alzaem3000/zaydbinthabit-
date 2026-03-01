import { Client } from 'pg';

const adminDbUrl = process.env.DATABASE_URL?.replace('zayd_app.ogpucjnajzjakplseewr', 'postgres.ogpucjnajzjakplseewr');

async function checkOwnership() {
    const client = new Client({
        connectionString: adminDbUrl,
    });

    try {
        await client.connect();

        // Check current owner of tables
        const res = await client.query(`
      SELECT tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

        const tables = res.rows.map(r => r.tablename);
        const targetUser = 'zayd_app';

        console.log("Using Connection String:", adminDbUrl);

        // Try to change ownership
        for (const table of tables) {
            if (res.rows.find(r => r.tablename === table && r.tableowner !== targetUser)) {
                console.log(`Attempting to alter ownership of ${table} to ${targetUser}`);
                try {
                    await client.query(`ALTER TABLE "${table}" OWNER TO "${targetUser}";`);
                    console.log(`Success for ${table}`);
                } catch (e: any) {
                    console.log(`Failed to alter owner for ${table}:`, e.message);
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkOwnership();

import { pool } from "../server/db";

async function checkOwners() {
  const result = await pool.query(
    `SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  console.log("📋 Table Owners:");
  for (const row of result.rows) {
    console.log(`  ${row.tablename} -> ${row.tableowner}`);
  }

  const currentUser = await pool.query(`SELECT current_user, session_user`);
  console.log(`\n👤 Connected as: ${currentUser.rows[0].current_user} (session: ${currentUser.rows[0].session_user})`);

  pool.end();
}

checkOwners().catch(e => { console.error(e); pool.end(); process.exit(1); });

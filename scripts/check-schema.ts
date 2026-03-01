import { pool } from "../server/db";

async function check() {
  // Check all schemas
  const schemas = await pool.query(
    `SELECT DISTINCT schemaname, tablename, tableowner 
     FROM pg_tables 
     WHERE tablename IN ('indicators','users','criteria','witnesses')
     ORDER BY schemaname, tablename`
  );
  console.log("📋 Tables found across all schemas:");
  for (const row of schemas.rows) {
    console.log(`  ${row.schemaname}.${row.tablename} -> owner: ${row.tableowner}`);
  }

  // Check search_path
  const sp = await pool.query(`SHOW search_path`);
  console.log(`\n🔍 search_path: ${sp.rows[0].search_path}`);

  // Check current schema
  const cs = await pool.query(`SELECT current_schema()`);
  console.log(`📂 current_schema: ${cs.rows[0].current_schema}`);

  pool.end();
}

check().catch(e => { console.error(e); pool.end(); process.exit(1); });

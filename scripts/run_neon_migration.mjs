import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_Cinp6Qm7ePZS@ep-curly-poetry-ai1sga58-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('Connected to Neon ✓');

// Check if column exists
const check = await client.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name='witnesses' AND column_name='performance_standard_id'
`);

if (check.rows.length > 0) {
    console.log('Column performance_standard_id already EXISTS ✓');
} else {
    console.log('Column NOT found — applying migration...');
    await client.query(`
    ALTER TABLE witnesses 
    ADD COLUMN performance_standard_id INTEGER 
    REFERENCES performance_standards(id) ON DELETE CASCADE
  `);
    console.log('Migration applied successfully ✓');
}

await client.end();

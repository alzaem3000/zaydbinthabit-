const { Pool } = require('pg');
const url = 'postgresql://neondb_owner:npg_Cinp6Qm7ePZS@ep-curly-poetry-ai1sga58-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const p = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
console.log('Connecting to Neon...');
p.query('SELECT current_user, current_database()')
    .then(r => { console.log('CONNECTED!', JSON.stringify(r.rows)); p.end(); })
    .catch(e => { console.error('FAIL:', e.message.substring(0, 150)); p.end(); });

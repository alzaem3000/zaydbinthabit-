import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import dns from 'dns';

// Force IPv4 DNS resolution (workaround for IPv6-only Supabase endpoints)
dns.setDefaultResultOrder('ipv4first');

// Parse DATABASE_URL or use individual env vars
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use explicit config to avoid URL encoding issues with special char passwords
let poolConfig: any;
try {
  const url = new URL(dbUrl);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.replace('/', '') || 'postgres',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false },
  };
  console.log(`DB connecting to ${url.hostname}:${url.port} as ${url.username}`);
} catch {
  poolConfig = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  };
}

export const pool = new Pool(poolConfig);

export const db = drizzle({ client: pool, schema });


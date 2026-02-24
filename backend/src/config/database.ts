import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from './index.js';
import { logger } from './logger.js';

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL error', err);
});

export const db = drizzle(pool);
export { pool };

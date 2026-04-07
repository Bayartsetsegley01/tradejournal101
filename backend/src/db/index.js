import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;
let isConnected = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    isConnected = false;
  });
}

export const initDb = async () => {
  if (!pool) {
    console.warn('DATABASE_URL not set. Running in mock mode.');
    return;
  }

  try {
    const client = await pool.connect();
    isConnected = true;
    console.log('Connected to PostgreSQL database');
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('Database schema initialized');
    
    client.release();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    isConnected = false;
  }
};

export const query = async (text, params) => {
  if (!pool || !isConnected) {
    throw new Error('Database not connected');
  }
  return pool.query(text, params);
};

export const getDbStatus = () => isConnected;
export const getPool = () => pool;

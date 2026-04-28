import { query } from '../config/database.js';

export const Settings = {
  get: (key) => query('SELECT value FROM app_config WHERE key=$1', [key]),
  set: (key, value) => query(
    'INSERT INTO app_config (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()',
    [key, String(value)]
  ),
  getAll: () => query('SELECT * FROM app_config'),
};

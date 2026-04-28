import { query } from '../config/database.js';

export const Tag = {
  findAll: (userId) => query(
    'SELECT * FROM tag_definitions WHERE user_id=$1 OR is_default=true ORDER BY name',
    [userId]
  ),
  create: (userId, name, type, color) => query(
    'INSERT INTO tag_definitions (user_id,name,type,color) VALUES ($1,$2,$3,$4) RETURNING *',
    [userId, name, type, color || '#gray']
  ),
  delete: (id) => query('DELETE FROM tag_definitions WHERE id=$1', [id]),
};

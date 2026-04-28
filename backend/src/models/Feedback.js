import { query } from '../config/database.js';

export const Feedback = {
  findAll: () => query(
    'SELECT f.*,u.name as user_name FROM feedback f LEFT JOIN users u ON u.id=f.user_id ORDER BY f.created_at DESC'
  ),
  findById: (id) => query('SELECT * FROM feedback WHERE id=$1', [id]),
  create: (userId, message, category) => query(
    'INSERT INTO feedback (user_id,message,category,status,created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
    [userId, message, category || 'general', 'new']
  ),
  updateStatus: (id, status) => query(
    'UPDATE feedback SET status=$1 WHERE id=$2 RETURNING *',
    [status, id]
  ),
  delete: (id) => query('DELETE FROM feedback WHERE id=$1', [id]),
};

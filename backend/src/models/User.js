import { query } from '../config/database.js';

export const User = {
  findById: (id) => query('SELECT * FROM users WHERE id = $1', [id]),
  findByEmail: (email) => query('SELECT * FROM users WHERE email = $1', [email]),
  findByGoogleId: (googleId) => query('SELECT * FROM users WHERE google_id = $1', [googleId]),
  create: (data) => query(
    `INSERT INTO users (name, email, password_hash, role, auth_provider, created_at)
     VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
    [data.name, data.email, data.passwordHash, data.role || 'user', data.authProvider || 'email']
  ),
  update: (id, data) => query(
    'UPDATE users SET name=$1, avatar_url=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
    [data.name, data.avatarUrl, id]
  ),
  updateLastLogin: (id) => query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [id]),
  delete: (id) => query('DELETE FROM users WHERE id=$1', [id]),
  getAll: () => query(
    'SELECT id,name,email,role,is_active,created_at,last_login_at,auth_provider,avatar_url FROM users ORDER BY created_at DESC'
  ),
  getStats: () => query(
    `SELECT COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE is_active=true)::int as active,
            COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '7 days')::int as new_this_week
     FROM users WHERE role != 'admin'`
  ),
};

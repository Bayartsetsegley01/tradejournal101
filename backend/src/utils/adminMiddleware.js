import { query } from '../db/index.js';

// Check DB role directly — handles the case where role was set after token was issued
export const requireAdmin = async (req, res, next) => {
  if (!req.user) return res.status(403).json({ error: 'Admin access required' });
  try {
    const r = await query('SELECT role FROM users WHERE id=$1', [req.user.id]);
    if (!r.rows[0] || r.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch {
    // DB unavailable — fall back to JWT role
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  }
};

import { query } from '../config/database.js';

export const apiKeyAuth = async (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ success: false, error: 'X-Api-Key header required' });
  try {
    const result = await query('SELECT id FROM users WHERE mt5_api_key=$1', [key]);
    if (!result.rows[0]) return res.status(401).json({ success: false, error: 'Invalid API key' });
    req.userId = result.rows[0].id;
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: 'Auth error' });
  }
};

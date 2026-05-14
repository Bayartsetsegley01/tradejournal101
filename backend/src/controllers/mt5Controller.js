import { query } from '../config/database.js';
import crypto from 'crypto';

export const getApiKey = async (req, res) => {
  try {
    const result = await query('SELECT mt5_api_key FROM users WHERE id=$1', [req.user.id]);
    res.json({ success: true, data: { api_key: result.rows[0]?.mt5_api_key || null } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const generateApiKey = async (req, res) => {
  try {
    const key = crypto.randomBytes(32).toString('hex');
    await query('UPDATE users SET mt5_api_key=$1 WHERE id=$2', [key, req.user.id]);
    res.json({ success: true, data: { api_key: key } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const syncTrade = async (req, res) => {
  try {
    const t = req.body;
    const symbol = (t.symbol || '').trim();
    if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });

    const direction = (t.direction || '').toUpperCase();
    if (!['LONG', 'SHORT'].includes(direction))
      return res.status(400).json({ success: false, error: 'direction must be LONG or SHORT' });

    const entryPrice  = parseFloat(t.entry_price)  || null;
    const exitPrice   = parseFloat(t.exit_price)   || null;
    const pnl         = parseFloat(t.pnl)          ?? null;
    const volume      = parseFloat(t.volume)        || null;
    const entryDate   = t.entry_date ? new Date(t.entry_date.replace(/\./g, '-')) : null;
    const exitDate    = t.exit_date  ? new Date(t.exit_date.replace(/\./g, '-'))  : null;
    const notes       = (t.comment || '').trim() || null;

    const result = await query(
      `INSERT INTO trades
         (user_id, status, symbol, direction, entry_price, exit_price,
          position_size, pnl, entry_date, exit_date, notes, market_type)
       VALUES ($1,'CLOSED',$2,$3,$4,$5,$6,$7,$8,$9,$10,'FOREX')
       RETURNING id`,
      [req.userId, symbol, direction, entryPrice, exitPrice,
       volume, pnl, entryDate, exitDate, notes]
    );

    res.status(201).json({ success: true, data: { id: result.rows[0].id } });
  } catch (e) {
    console.error('MT5 sync error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

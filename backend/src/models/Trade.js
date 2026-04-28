import { query } from '../config/database.js';

export const Trade = {
  findById: (id) => query('SELECT * FROM trades WHERE id=$1', [id]),
  findByUser: (userId) => query('SELECT * FROM trades WHERE user_id=$1 ORDER BY trade_date DESC', [userId]),
  create: (data) => query(
    `INSERT INTO trades (user_id,symbol,market_type,direction,entry_price,exit_price,pnl,rr_ratio,status,trade_date,notes,lessons_learned)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [data.userId, data.symbol, data.marketType, data.direction, data.entryPrice, data.exitPrice,
     data.pnl, data.rrRatio, data.status || 'OPEN', data.tradeDate, data.notes, data.lessonsLearned]
  ),
  update: (id, data) => query(
    `UPDATE trades SET symbol=$1,market_type=$2,direction=$3,entry_price=$4,exit_price=$5,pnl=$6,
     rr_ratio=$7,status=$8,notes=$9,lessons_learned=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,
    [data.symbol, data.marketType, data.direction, data.entryPrice, data.exitPrice,
     data.pnl, data.rrRatio, data.status, data.notes, data.lessonsLearned, id]
  ),
  delete: (id) => query('DELETE FROM trades WHERE id=$1', [id]),
  getStats: (userId) => query(
    `SELECT COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE pnl>0)::int as wins,
            COUNT(*) FILTER (WHERE pnl<0)::int as losses,
            COALESCE(SUM(pnl),0)::float as total_pnl,
            COALESCE(AVG(rr_ratio),0)::float as avg_rr
     FROM trades WHERE user_id=$1`,
    [userId]
  ),
};

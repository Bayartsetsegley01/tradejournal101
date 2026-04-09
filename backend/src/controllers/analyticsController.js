import { query, getDbStatus } from '../db/index.js';

const getDateFilter = (timeRange, paramStart = 2) => {
  if (!timeRange || timeRange === 'all') return { sql: '', params: [] };
  const now = new Date();
  let startDate = new Date();
  if (timeRange === 'today') startDate.setHours(0,0,0,0);
  else if (timeRange === '7d') startDate.setDate(now.getDate()-7);
  else if (timeRange === '1m') startDate.setMonth(now.getMonth()-1);
  else if (timeRange === '3m') startDate.setMonth(now.getMonth()-3);
  else if (timeRange === '6m') startDate.setMonth(now.getMonth()-6);
  else if (timeRange === '1y') startDate.setFullYear(now.getFullYear()-1);
  else if (timeRange.includes('_')) {
    const [s,e] = timeRange.split('_');
    const start = new Date(s), end = new Date(e);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (e.length<=10) end.setHours(23,59,59,999);
      return { sql: ` AND exit_date >= $${paramStart} AND exit_date <= $${paramStart+1}`, params: [start.toISOString(), end.toISOString()] };
    }
  }
  return { sql: ` AND exit_date >= $${paramStart}`, params: [startDate.toISOString()] };
};

export const getSummary = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const filter = getDateFilter(req.query.range || req.query.timeRange);
    const result = await query(
      `SELECT COUNT(*) as total_trades, SUM(CASE WHEN pnl>0 THEN 1 ELSE 0 END) as winning_trades, SUM(pnl) as net_pnl, SUM(CASE WHEN pnl>0 THEN pnl ELSE 0 END) as gross_profit, SUM(CASE WHEN pnl<0 THEN pnl ELSE 0 END) as gross_loss FROM trades WHERE user_id=$1 AND status='CLOSED' ${filter.sql}`,
      [userId, ...filter.params]
    );
    const r = result.rows[0];
    const totalTrades = parseInt(r.total_trades)||0, winningTrades = parseInt(r.winning_trades)||0;
    const netPnl = parseFloat(r.net_pnl)||0, grossProfit = parseFloat(r.gross_profit)||0, grossLoss = Math.abs(parseFloat(r.gross_loss)||0);
    res.json({ success: true, data: { netPnl, winRate: totalTrades>0?(winningTrades/totalTrades)*100:0, profitFactor: grossLoss>0?grossProfit/grossLoss:(grossProfit>0?grossProfit:0), totalTrades } });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCharts = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const filter = getDateFilter(req.query.range || req.query.timeRange);
    const result = await query(
      `SELECT exit_date, pnl FROM trades WHERE user_id=$1 AND status='CLOSED' AND exit_date IS NOT NULL ${filter.sql} ORDER BY exit_date ASC`,
      [userId, ...filter.params]
    );
    let cum = 0;
    const equityCurve = result.rows.map(r => { cum += parseFloat(r.pnl)||0; return { date: r.exit_date, pnl: parseFloat(r.pnl)||0, equity: cum }; });
    res.json({ success: true, data: { equityCurve } });
  } catch (error) {
    console.error('getCharts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMistakes = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const filter = getDateFilter(req.query.range || req.query.timeRange);
    const result = await query(
      `SELECT notes, lessons_learned FROM trades WHERE user_id=$1 AND status='CLOSED' ${filter.sql}`,
      [userId, ...filter.params]
    );
    res.json({ success: true, data: { trades: result.rows } });
  } catch (error) {
    console.error('getMistakes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

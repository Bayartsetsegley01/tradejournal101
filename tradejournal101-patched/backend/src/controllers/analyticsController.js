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

export const getWeeklyReview = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;

    // Default: current week (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const start = req.query.start ? new Date(req.query.start) : weekStart;
    const end = req.query.end ? new Date(req.query.end) : weekEnd;

    const result = await query(
      `SELECT * FROM trades WHERE user_id=$1 AND status='CLOSED'
       AND exit_date >= $2 AND exit_date <= $3 ORDER BY exit_date ASC`,
      [userId, start.toISOString(), end.toISOString()]
    );
    const trades = result.rows;

    const review = buildReview(trades, 'weekly', start, end);
    res.json({ success: true, data: review });
  } catch (error) {
    console.error('getWeeklyReview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMonthlyReview = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;

    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1; // 1-12

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await query(
      `SELECT * FROM trades WHERE user_id=$1 AND status='CLOSED'
       AND exit_date >= $2 AND exit_date <= $3 ORDER BY exit_date ASC`,
      [userId, start.toISOString(), end.toISOString()]
    );
    const trades = result.rows;

    const review = buildReview(trades, 'monthly', start, end);
    res.json({ success: true, data: review });
  } catch (error) {
    console.error('getMonthlyReview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

function buildReview(trades, type, start, end) {
  if (trades.length === 0) {
    return {
      type,
      period: { start, end },
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      netPnl: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      bestTrade: null,
      worstTrade: null,
      avgRR: 0,
      topMistakeTags: [],
      topPositiveTags: [],
      emotionStats: {},
      dailyBreakdown: [],
      summary: 'Энэ хугацаанд арилжаа байхгүй байна.',
    };
  }

  const winners = trades.filter(t => parseFloat(t.pnl) > 0);
  const losers = trades.filter(t => parseFloat(t.pnl) <= 0);
  const netPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
  const grossProfit = winners.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0));
  const avgWin = winners.length ? grossProfit / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;

  const sorted = [...trades].sort((a, b) => parseFloat(b.pnl) - parseFloat(a.pnl));
  const bestTrade = sorted[0] || null;
  const worstTrade = sorted[sorted.length - 1] || null;

  const rrValues = trades.map(t => parseFloat(t.rr_ratio)).filter(v => !isNaN(v) && v > 0);
  const avgRR = rrValues.length ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;

  // Tag frequency
  const mistakeCount = {};
  const positiveCount = {};
  trades.forEach(t => {
    let mt = t.mistake_tags;
    if (typeof mt === 'string') { try { mt = JSON.parse(mt); } catch { mt = []; } }
    (mt || []).forEach(tag => { mistakeCount[tag] = (mistakeCount[tag] || 0) + 1; });

    let pt = t.positive_tags;
    if (typeof pt === 'string') { try { pt = JSON.parse(pt); } catch { pt = []; } }
    (pt || []).forEach(tag => { positiveCount[tag] = (positiveCount[tag] || 0) + 1; });
  });
  const topMistakeTags = Object.entries(mistakeCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
  const topPositiveTags = Object.entries(positiveCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Emotion stats
  const emotionStats = {};
  trades.forEach(t => {
    if (t.emotion_before) {
      if (!emotionStats[t.emotion_before]) emotionStats[t.emotion_before] = { count: 0, totalPnl: 0 };
      emotionStats[t.emotion_before].count++;
      emotionStats[t.emotion_before].totalPnl += parseFloat(t.pnl) || 0;
    }
  });

  // Daily breakdown
  const dailyMap = {};
  trades.forEach(t => {
    const day = (t.exit_date || t.entry_date || '').slice(0, 10);
    if (!day) return;
    if (!dailyMap[day]) dailyMap[day] = { date: day, trades: 0, pnl: 0, wins: 0 };
    dailyMap[day].trades++;
    dailyMap[day].pnl += parseFloat(t.pnl) || 0;
    if (parseFloat(t.pnl) > 0) dailyMap[day].wins++;
  });
  const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  const winRate = trades.length ? (winners.length / trades.length) * 100 : 0;

  // Auto summary
  const trend = netPnl > 0 ? 'ашигтай' : 'алдагдалтай';
  const summary = `${type === 'weekly' ? 'Долоо хоногийн' : 'Сарын'} дүгнэлт: ${trades.length} арилжаа, ${winRate.toFixed(0)}% win rate, нийт ${netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)} PnL (${trend}).`;

  return {
    type,
    period: { start, end },
    totalTrades: trades.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    winRate: parseFloat(winRate.toFixed(2)),
    netPnl: parseFloat(netPnl.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    profitFactor: grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? grossProfit : 0,
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    bestTrade,
    worstTrade,
    avgRR: parseFloat(avgRR.toFixed(2)),
    topMistakeTags,
    topPositiveTags,
    emotionStats,
    dailyBreakdown,
    summary,
  };
}

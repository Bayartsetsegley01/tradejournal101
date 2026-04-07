import { query, getDbStatus } from '../db/index.js';
import { mockTrades } from '../utils/mockData.js';

const getDateFilter = (timeRange) => {
  if (!timeRange || timeRange === 'all') return { sql: '', params: [], mockFilter: () => true };
  
  const now = new Date();
  let startDate = new Date();
  
  if (timeRange === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (timeRange === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else if (timeRange === '1m') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (timeRange === '3m') {
    startDate.setMonth(now.getMonth() - 3);
  } else if (timeRange === '6m') {
    startDate.setMonth(now.getMonth() - 6);
  } else if (timeRange === '1y') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else if (timeRange.includes('_')) {
    const [startStr, endStr] = timeRange.split('_');
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Set end to end of day if no time provided
      if (endStr.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      return {
        sql: ` AND exit_date >= $1 AND exit_date <= $2`,
        params: [start.toISOString(), end.toISOString()],
        mockFilter: (t) => {
          const d = new Date(t.exit_date || t.entry_date);
          return d >= start && d <= end;
        }
      };
    }
  }

  return {
    sql: ` AND exit_date >= $1`,
    params: [startDate.toISOString()],
    mockFilter: (t) => new Date(t.exit_date || t.entry_date) >= startDate
  };
};

export const getSummary = async (req, res) => {
  const timeRange = req.query.range || req.query.timeRange;
  const filter = getDateFilter(timeRange);

  try {
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");

    const dbQuery = `
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(pnl) as net_pnl,
        SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as gross_profit,
        SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) as gross_loss
      FROM trades
      WHERE status = 'CLOSED' ${filter.sql}
    `;
    
    const result = await query(dbQuery, filter.params);
    const row = result.rows[0];
    
    const totalTrades = parseInt(row.total_trades) || 0;
    const winningTrades = parseInt(row.winning_trades) || 0;
    const netPnl = parseFloat(row.net_pnl) || 0;
    const grossProfit = parseFloat(row.gross_profit) || 0;
    const grossLoss = Math.abs(parseFloat(row.gross_loss) || 0);
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);

    res.json({ 
      success: true, 
      data: {
        netPnl,
        winRate,
        profitFactor,
        totalTrades
      },
      mode: 'database'
    });
  } catch (error) {
    // Fallback to mock data
    const closedTrades = mockTrades.filter(t => t.status === 'CLOSED' && filter.mockFilter(t));
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
    const netPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossProfit = closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);

    res.json({ 
      success: true, 
      data: {
        netPnl,
        winRate,
        profitFactor,
        totalTrades
      },
      mode: 'mock' 
    });
  }
};

export const getCharts = async (req, res) => {
  const timeRange = req.query.range || req.query.timeRange;
  const filter = getDateFilter(timeRange);

  try {
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");

    const dbQuery = `
      SELECT 
        exit_date,
        pnl
      FROM trades
      WHERE status = 'CLOSED' AND exit_date IS NOT NULL ${filter.sql}
      ORDER BY exit_date ASC
    `;
    
    const result = await query(dbQuery, filter.params);
    
    let cumulativePnl = 0;
    const equityCurve = result.rows.map(row => {
      cumulativePnl += parseFloat(row.pnl) || 0;
      return {
        date: row.exit_date,
        pnl: parseFloat(row.pnl) || 0,
        equity: cumulativePnl
      };
    });

    res.json({ success: true, data: { equityCurve }, mode: 'database' });
  } catch (error) {
    // Fallback to mock data
    const closedTrades = mockTrades
      .filter(t => t.status === 'CLOSED' && t.exit_date && filter.mockFilter(t))
      .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date));
      
    let cumulativePnl = 0;
    const equityCurve = closedTrades.map(t => {
      cumulativePnl += t.pnl || 0;
      return {
        date: t.exit_date,
        pnl: t.pnl || 0,
        equity: cumulativePnl
      };
    });

    res.json({ success: true, data: { equityCurve }, mode: 'mock' });
  }
};

export const getMistakes = async (req, res) => {
  const timeRange = req.query.range || req.query.timeRange;
  const filter = getDateFilter(timeRange);

  try {
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");

    const dbQuery = `
      SELECT tags, mistake_tags, emotion, emotion_before, emotion_after
      FROM trades
      WHERE status = 'CLOSED' ${filter.sql}
    `;
    
    const result = await query(dbQuery, filter.params);
    
    // Calculate mistakes and emotions
    const mistakesCount = {};
    const emotionsCount = {};
    let totalWithEmotion = 0;

    result.rows.forEach(row => {
      const mistakeTags = row.mistaketags || row.mistake_tags || row.tags || [];
      if (Array.isArray(mistakeTags)) {
        mistakeTags.forEach(tag => {
          mistakesCount[tag] = (mistakesCount[tag] || 0) + 1;
        });
      }
      
      const emotionBefore = row.emotionbefore || row.emotion_before;
      const emotionAfter = row.emotionafter || row.emotion_after;
      const emotion = row.emotion;

      if (emotionBefore) {
        emotionsCount[emotionBefore] = (emotionsCount[emotionBefore] || 0) + 1;
        totalWithEmotion++;
      }
      if (emotionAfter) {
        emotionsCount[emotionAfter] = (emotionsCount[emotionAfter] || 0) + 1;
        totalWithEmotion++;
      }
      if (emotion && !emotionBefore && !emotionAfter) {
        emotionsCount[emotion] = (emotionsCount[emotion] || 0) + 1;
        totalWithEmotion++;
      }
    });

    const mistakes = Object.entries(mistakesCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const emotions = Object.entries(emotionsCount)
      .map(([name, count]) => ({ name, percentage: Math.round((count / totalWithEmotion) * 100) }))
      .sort((a, b) => b.percentage - a.percentage);

    res.json({ success: true, data: { mistakes, emotions }, mode: 'database' });
  } catch (error) {
    // Fallback to mock data
    const closedTrades = mockTrades.filter(t => t.status === 'CLOSED' && filter.mockFilter(t));
    
    const mistakesCount = {};
    const emotionsCount = {};
    let totalWithEmotion = 0;

    closedTrades.forEach(row => {
      const mistakeTags = row.mistakeTags || row.tags || [];
      if (Array.isArray(mistakeTags)) {
        mistakeTags.forEach(tag => {
          mistakesCount[tag] = (mistakesCount[tag] || 0) + 1;
        });
      }
      
      const emotionBefore = row.emotionBefore;
      const emotionAfter = row.emotionAfter;
      const emotion = row.emotion;

      if (emotionBefore) {
        emotionsCount[emotionBefore] = (emotionsCount[emotionBefore] || 0) + 1;
        totalWithEmotion++;
      }
      if (emotionAfter) {
        emotionsCount[emotionAfter] = (emotionsCount[emotionAfter] || 0) + 1;
        totalWithEmotion++;
      }
      if (emotion && !emotionBefore && !emotionAfter) {
        emotionsCount[emotion] = (emotionsCount[emotion] || 0) + 1;
        totalWithEmotion++;
      }
    });

    const mistakes = Object.entries(mistakesCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const emotions = Object.entries(emotionsCount)
      .map(([name, count]) => ({ name, percentage: Math.round((count / totalWithEmotion) * 100) }))
      .sort((a, b) => b.percentage - a.percentage);

    // If no data, provide some mock defaults
    if (mistakes.length === 0) {
      mistakes.push(
        { name: 'FOMO', count: 12 },
        { name: 'Төлөвлөгөө дагаагүй', count: 8 },
        { name: 'Stop Loss хөдөлгөсөн', count: 5 }
      );
    }
    if (emotions.length === 0) {
      emotions.push(
        { name: 'Шунал', percentage: 30 },
        { name: 'Айдас', percentage: 25 },
        { name: 'Тэвчээргүй', percentage: 45 }
      );
    }

    res.json({ success: true, data: { mistakes, emotions }, mode: 'mock' });
  }
};

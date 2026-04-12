import { query, getDbStatus } from '../db/index.js';

export const importTrades = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    const userId = req.user.id;
    const { trades } = req.body;

    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ success: false, error: 'No trades data provided' });
    }

    let imported = 0;
    let errors = [];

    for (let i = 0; i < trades.length; i++) {
      const t = trades[i];
      try {
        await query(
          `INSERT INTO trades (user_id, status, symbol, market_type, direction, strategy, session,
            entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
            position_size, pnl, rr_ratio, notes, lessons_learned)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [
            userId,
            t.status || 'CLOSED',
            t.symbol || t.pair || t.ticker || '',
            t.market_type || t.market || t.type || 'forex',
            t.direction || t.side || (t.type === 'BUY' ? 'LONG' : t.type === 'SELL' ? 'SHORT' : 'LONG'),
            t.strategy || '',
            t.session || '',
            t.entry_date || t.open_date || t.date || null,
            t.exit_date || t.close_date || null,
            parseFloat(t.entry_price || t.open_price || t.entry || 0) || null,
            parseFloat(t.exit_price || t.close_price || t.exit || 0) || null,
            parseFloat(t.stop_loss || t.sl || 0) || null,
            parseFloat(t.take_profit || t.tp || 0) || null,
            parseFloat(t.position_size || t.quantity || t.size || t.lot || 0) || null,
            parseFloat(t.pnl || t.profit || t.pl || t.profit_loss || 0) || null,
            parseFloat(t.rr_ratio || t.rr || 0) || null,
            t.notes || t.comment || t.description || '',
            t.lessons_learned || t.lessons || ''
          ]
        );
        imported++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message, symbol: t.symbol || t.pair || 'unknown' });
      }
    }

    res.json({
      success: true,
      data: {
        total: trades.length,
        imported,
        failed: errors.length,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

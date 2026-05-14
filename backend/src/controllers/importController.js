import { query, getDbStatus } from '../config/database.js';

const VALID_DIRECTIONS = new Set(['LONG', 'SHORT']);
const VALID_STATUSES = new Set(['OPEN', 'CLOSED']);

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
    const errors = [];

    for (let i = 0; i < trades.length; i++) {
      const t = trades[i];
      try {
        const symbol = (t.symbol || t.pair || t.ticker || '').trim();
        if (!symbol) throw new Error('symbol is required');

        const direction = (t.direction || t.side || '').toUpperCase();
        if (!VALID_DIRECTIONS.has(direction)) throw new Error(`direction must be LONG or SHORT, got "${t.direction}"`);

        const status = (t.status || 'CLOSED').toUpperCase();
        if (!VALID_STATUSES.has(status)) throw new Error(`status must be OPEN or CLOSED, got "${t.status}"`);

        const entryDate   = t.date || t.entry_date || t.open_date || null;
        const exitDate    = t.exit_date || t.close_date || null;
        const entryPrice  = parseFloat(t.entry || t.entry_price || t.open_price || 0) || null;
        const exitPrice   = parseFloat(t.exit  || t.exit_price  || t.close_price || 0) || null;
        const stopLoss    = parseFloat(t.stop_loss || t.sl || 0) || null;
        const takeProfit  = parseFloat(t.take_profit || t.tp || 0) || null;
        const positionSize = parseFloat(t.quantity || t.position_size || t.size || t.lot || 0) || null;
        const riskPercent = parseFloat(t.risk_pct || t.risk_percent || t.risk || 0) || null;
        const rrRatio     = parseFloat(t.rr || t.rr_ratio || 0) || null;
        const pnl         = parseFloat(t.pnl || t.profit || t.pl || 0) || null;

        const strategy     = (t.strategy || t.psychology || '').trim() || null;
        const session      = (t.session || '').trim() || null;
        const marketType   = (t.market_type || t.market || '').trim() || null;
        const emotionBefore = (t.emotion_before || '').trim() || null;
        const emotionAfter  = (t.emotion_after  || '').trim() || null;

        // Long text fields — no truncation
        const notes       = (t.note || t.notes || t.comment || t.description || '').trim() || null;
        const whyEntered  = (t.why_entered || t.reason || '').trim() || null;
        const whatHappened = (t.what_happened || '').trim() || null;
        const lessonsLearned = (t.lessons || t.lessons_learned || t.lesson || '').trim() || null;

        await query(
          `INSERT INTO trades (
            user_id, status, symbol, market_type, direction, strategy, session,
            entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
            position_size, pnl, rr_ratio, risk_percent,
            notes, lessons_learned, why_entered, what_happened,
            emotion_before, emotion_after
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,$12,$13,
            $14,$15,$16,$17,
            $18,$19,$20,$21,
            $22,$23
          )`,
          [
            userId, status, symbol, marketType, direction, strategy, session,
            entryDate ? new Date(entryDate) : null,
            exitDate  ? new Date(exitDate)  : null,
            entryPrice, exitPrice, stopLoss, takeProfit,
            positionSize, pnl, rrRatio, riskPercent,
            notes, lessonsLearned, whyEntered, whatHappened,
            emotionBefore, emotionAfter,
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
        errors: errors.slice(0, 10),
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

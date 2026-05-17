import { query, getDbStatus } from '../config/database.js';

export const getJournal = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { tradeId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const tradeCheck = await query('SELECT id FROM trades WHERE id=$1 AND user_id=$2', [tradeId, userId]);
    if (!tradeCheck.rows[0]) return res.status(404).json({ success: false, error: 'Trade not found' });

    const result = await query('SELECT * FROM trade_notes WHERE trade_id=$1', [tradeId]);
    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveJournal = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { tradeId } = req.params;
    const userId = req.user.id;
    const { general_notes, lessons_learned } = req.body;

    // Verify ownership
    const tradeCheck = await query('SELECT id FROM trades WHERE id=$1 AND user_id=$2', [tradeId, userId]);
    if (!tradeCheck.rows[0]) return res.status(404).json({ success: false, error: 'Trade not found' });

    const existing = await query('SELECT id FROM trade_notes WHERE trade_id=$1', [tradeId]);
    let result;
    if (existing.rows[0]) {
      result = await query(
        'UPDATE trade_notes SET general_notes=$1, lessons_learned=$2, updated_at=CURRENT_TIMESTAMP WHERE trade_id=$3 RETURNING *',
        [general_notes, lessons_learned, tradeId]
      );
    } else {
      result = await query(
        'INSERT INTO trade_notes (trade_id, general_notes, lessons_learned) VALUES ($1,$2,$3) RETURNING *',
        [tradeId, general_notes, lessons_learned]
      );
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

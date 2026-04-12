import { query, getDbStatus } from '../db/index.js';

export const getTrades = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const result = await query('SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getTrades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addTrade = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const {
      status, symbol, market_type, direction, strategy, session,
      entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
      // Emotion & tag fields
      emotion_before, emotion_after, emotionBefore, emotionAfter,
      positive_tags, mistake_tags, positiveTags, mistakeTags,
      why_entered, whyEntered, what_happened, whatHappened,
      what_went_well, whatWentWell, mistakes_made, mistakesMade,
      setup_description, setupDescription
    } = req.body;

    const eBefore = emotion_before || emotionBefore || null;
    const eAfter = emotion_after || emotionAfter || null;
    const posTags = JSON.stringify(positive_tags || positiveTags || []);
    const misTags = JSON.stringify(mistake_tags || mistakeTags || []);
    const whyEnt = why_entered || whyEntered || null;
    const whatHap = what_happened || whatHappened || null;
    const whatWell = what_went_well || whatWentWell || null;
    const mistMade = mistakes_made || mistakesMade || null;
    const setupDesc = setup_description || setupDescription || null;

    const result = await query(
      `INSERT INTO trades (
        user_id, status, symbol, market_type, direction, strategy, session,
        entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
        position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
        emotion_before, emotion_after, positive_tags, mistake_tags,
        why_entered, what_happened, what_went_well, mistakes_made, setup_description
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) RETURNING *`,
      [
        userId, status||'CLOSED', symbol, market_type, direction, strategy, session,
        entry_date?new Date(entry_date):null, exit_date?new Date(exit_date):null,
        entry_price, exit_price, stop_loss, take_profit, position_size, pnl, rr_ratio,
        notes, lessons_learned, screenshot_url,
        eBefore, eAfter, posTags, misTags,
        whyEnt, whatHap, whatWell, mistMade, setupDesc
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('addTrade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTrade = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const userId = req.user.id;
    const {
      status, symbol, market_type, direction, strategy, session,
      entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
      emotion_before, emotion_after, emotionBefore, emotionAfter,
      positive_tags, mistake_tags, positiveTags, mistakeTags,
      why_entered, whyEntered, what_happened, whatHappened,
      what_went_well, whatWentWell, mistakes_made, mistakesMade,
      setup_description, setupDescription
    } = req.body;

    const eBefore = emotion_before || emotionBefore || null;
    const eAfter = emotion_after || emotionAfter || null;
    const posTags = JSON.stringify(positive_tags || positiveTags || []);
    const misTags = JSON.stringify(mistake_tags || mistakeTags || []);
    const whyEnt = why_entered || whyEntered || null;
    const whatHap = what_happened || whatHappened || null;
    const whatWell = what_went_well || whatWentWell || null;
    const mistMade = mistakes_made || mistakesMade || null;
    const setupDesc = setup_description || setupDescription || null;

    const result = await query(
      `UPDATE trades SET
        status=$1, symbol=$2, market_type=$3, direction=$4, strategy=$5, session=$6,
        entry_date=$7, exit_date=$8, entry_price=$9, exit_price=$10, stop_loss=$11,
        take_profit=$12, position_size=$13, pnl=$14, rr_ratio=$15, notes=$16,
        lessons_learned=$17, screenshot_url=$18,
        emotion_before=$19, emotion_after=$20, positive_tags=$21, mistake_tags=$22,
        why_entered=$23, what_happened=$24, what_went_well=$25, mistakes_made=$26,
        setup_description=$27, updated_at=CURRENT_TIMESTAMP
       WHERE id=$28 AND user_id=$29 RETURNING *`,
      [
        status||'CLOSED', symbol, market_type, direction, strategy, session,
        entry_date?new Date(entry_date):null, exit_date?new Date(exit_date):null,
        entry_price, exit_price, stop_loss, take_profit, position_size, pnl, rr_ratio,
        notes, lessons_learned, screenshot_url,
        eBefore, eAfter, posTags, misTags,
        whyEnt, whatHap, whatWell, mistMade, setupDesc,
        id, userId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Trade not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateTrade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTradeById = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const userId = req.user.id;
    const result = await query('SELECT * FROM trades WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Trade not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getTradeById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTrade = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const userId = req.user.id;
    const result = await query('DELETE FROM trades WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Trade not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('deleteTrade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTradeNotes = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const { general_notes, lessons_learned } = req.body;
    const check = await query('SELECT id FROM trade_notes WHERE trade_id = $1', [id]);
    let result;
    if (check.rows.length > 0) {
      result = await query('UPDATE trade_notes SET general_notes=$1, lessons_learned=$2, updated_at=CURRENT_TIMESTAMP WHERE trade_id=$3 RETURNING *', [general_notes, lessons_learned, id]);
    } else {
      result = await query('INSERT INTO trade_notes (trade_id, general_notes, lessons_learned) VALUES ($1,$2,$3) RETURNING *', [id, general_notes, lessons_learned]);
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateTradeNotes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addTradeMedia = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const { file_url, file_type } = req.body;
    const result = await query('INSERT INTO trade_media (trade_id, file_url, file_type) VALUES ($1,$2,$3) RETURNING *', [id, file_url, file_type]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('addTradeMedia error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

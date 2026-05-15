import { query, getDbStatus } from '../config/database.js';
import cloudinary from '../config/cloudinary.js';

const uniquePublicId = (userId) =>
  `tradejournal/${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const uploadBase64 = (dataUrl, userId) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload(dataUrl,
    { public_id: uniquePublicId(userId), resource_type: 'image', overwrite: false,
      transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' }] },
    (err, result) => { if (err) reject(err); else resolve(result.secure_url); }
  );
});

const resolveScreenshot = async (raw, userId) => {
  if (!raw) return null;
  if (raw.startsWith('data:')) {
    try { return await uploadBase64(raw, userId); } catch (e) { console.error('Screenshot upload failed:', e); return null; }
  }
  return raw;
};

export const getTrades = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const { account_id } = req.query;

    let result;
    if (account_id === 'personal') {
      result = await query(
        'SELECT * FROM trades WHERE user_id=$1 AND account_id IS NULL ORDER BY created_at DESC',
        [userId]
      );
    } else if (account_id) {
      result = await query(
        'SELECT * FROM trades WHERE user_id=$1 AND account_id=$2 ORDER BY created_at DESC',
        [userId, account_id]
      );
    } else {
      result = await query(
        'SELECT * FROM trades WHERE user_id=$1 ORDER BY created_at DESC',
        [userId]
      );
    }

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getTrades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const calculatePnL = (entry, exit, direction, qty, market) => {
  if (!entry || !exit || !qty) return 0;
  const diff = direction === 'LONG' ? exit - entry : entry - exit;
  const mkt = (market || 'forex').toLowerCase();
  if (mkt === 'forex') {
    if (entry < 10) return parseFloat((diff / 0.0001 * 10 * qty).toFixed(2));
    if (entry < 500) return parseFloat((diff / 0.01 * 10 * qty).toFixed(2));
  }
  return parseFloat((diff * qty).toFixed(2));
};

export const addTrade = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const b = req.body;
    
    const entryPrice = b.entry_price || b.entry || null;
    const exitPrice = b.exit_price || b.exit || null;
    const stopLoss = b.stop_loss || b.stopLoss || null;
    const takeProfit = b.take_profit || b.takeProfit || null;
    const positionSize = b.position_size || b.quantity || null;
    const entryDate = b.entry_date || b.date || null;
    const exitDate = b.exit_date || null;
    const marketType = b.market_type || b.market || null;
    const notes = b.notes || null;
    const lessonsLearned = b.lessons_learned || b.lessonLearned || null;
    const emotionBefore = b.emotion_before || b.emotionBefore || null;
    const emotionAfter = b.emotion_after || b.emotionAfter || null;
    const positiveTags = b.positive_tags || b.positiveTags || '[]';
    const mistakeTags = b.mistake_tags || b.mistakeTags || '[]';
    const whyEntered = b.why_entered || b.whyEntered || null;
    const whatHappened = b.what_happened || b.whatHappened || null;
    const whatWentWell = b.what_went_well || b.whatWentWell || null;
    const mistakesMade = b.mistakes_made || b.mistakesMade || null;
    const setupDescription = b.setup_description || b.setupDescription || null;
    const riskPercent = b.risk_percent != null ? b.risk_percent
                        : b.riskPercent  != null ? b.riskPercent : null;

    // Always recalculate PnL from price data when available (never trust frontend value)
    let pnl = null;
    if (entryPrice && exitPrice && positionSize) {
      pnl = calculatePnL(
        parseFloat(entryPrice), parseFloat(exitPrice),
        b.direction, parseFloat(positionSize), marketType
      );
    } else if (b.pnl != null) {
      pnl = b.pnl;
    }

    // Calculate R:R ratio
    let rrRatio = b.rr_ratio || null;
    if (!rrRatio && entryPrice && stopLoss && takeProfit) {
      const ep = parseFloat(entryPrice);
      const sl = parseFloat(stopLoss);
      const tp = parseFloat(takeProfit);
      if (!isNaN(ep) && !isNaN(sl) && !isNaN(tp) && Math.abs(ep - sl) > 0) {
        rrRatio = Math.abs(tp - ep) / Math.abs(ep - sl);
      }
    }

    const screenshotUrl = await resolveScreenshot(b.screenshot_url || null, userId);

    console.log('[addTrade] payload:', { symbol: b.symbol, direction: b.direction, entryPrice, exitPrice, pnl, riskPercent, positionSize });

    const result = await query(
      `INSERT INTO trades (user_id, status, symbol, market_type, direction, strategy, session,
        entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
        position_size, pnl, rr_ratio, risk_percent, notes, lessons_learned, screenshot_url,
        emotion_before, emotion_after, positive_tags, mistake_tags,
        why_entered, what_happened, what_went_well, mistakes_made, setup_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING *`,
      [userId, b.status||'CLOSED', b.symbol, marketType, b.direction, b.strategy, b.session,
        entryDate?new Date(entryDate):null, exitDate?new Date(exitDate):null,
        entryPrice, exitPrice, stopLoss, takeProfit,
        positionSize, pnl, rrRatio, riskPercent, notes, lessonsLearned, screenshotUrl,
        emotionBefore, emotionAfter,
        typeof positiveTags === 'string' ? positiveTags : JSON.stringify(positiveTags),
        typeof mistakeTags === 'string' ? mistakeTags : JSON.stringify(mistakeTags),
        whyEntered, whatHappened, whatWentWell, mistakesMade, setupDescription]
    );
    console.log('[addTrade] saved:', { id: result.rows[0].id, pnl: result.rows[0].pnl, risk_percent: result.rows[0].risk_percent });
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
    const b = req.body;
    
    const entryPrice = b.entry_price || b.entry || null;
    const exitPrice = b.exit_price || b.exit || null;
    const stopLoss = b.stop_loss || b.stopLoss || null;
    const takeProfit = b.take_profit || b.takeProfit || null;
    const positionSize = b.position_size || b.quantity || null;
    const entryDate = b.entry_date || b.date || null;
    const exitDate = b.exit_date || null;
    const marketType = b.market_type || b.market || null;
    const notes = b.notes || null;
    const lessonsLearned = b.lessons_learned || b.lessonLearned || null;
    const emotionBefore = b.emotion_before || b.emotionBefore || null;
    const emotionAfter = b.emotion_after || b.emotionAfter || null;
    const positiveTags = b.positive_tags || b.positiveTags || '[]';
    const mistakeTags = b.mistake_tags || b.mistakeTags || '[]';
    const whyEntered = b.why_entered || b.whyEntered || null;
    const whatHappened = b.what_happened || b.whatHappened || null;
    const whatWentWell = b.what_went_well || b.whatWentWell || null;
    const mistakesMade = b.mistakes_made || b.mistakesMade || null;
    const setupDescription = b.setup_description || b.setupDescription || null;
    const riskPercent = b.risk_percent != null ? b.risk_percent
                        : b.riskPercent  != null ? b.riskPercent : null;

    // Always recalculate PnL from price data when available (never trust frontend value)
    let pnl = null;
    if (entryPrice && exitPrice && positionSize) {
      pnl = calculatePnL(
        parseFloat(entryPrice), parseFloat(exitPrice),
        b.direction, parseFloat(positionSize), marketType
      );
    } else if (b.pnl != null) {
      pnl = b.pnl;
    }

    let rrRatio = b.rr_ratio || null;
    if (!rrRatio && entryPrice && stopLoss && takeProfit) {
      const ep = parseFloat(entryPrice);
      const sl = parseFloat(stopLoss);
      const tp = parseFloat(takeProfit);
      if (!isNaN(ep) && !isNaN(sl) && !isNaN(tp) && Math.abs(ep - sl) > 0) {
        rrRatio = Math.abs(tp - ep) / Math.abs(ep - sl);
      }
    }

    const screenshotUrl = await resolveScreenshot(b.screenshot_url || null, userId);

    console.log('[updateTrade] payload:', { id, symbol: b.symbol, direction: b.direction, entryPrice, exitPrice, pnl, riskPercent, positionSize });

    const result = await query(
      `UPDATE trades SET status=$1, symbol=$2, market_type=$3, direction=$4, strategy=$5, session=$6,
        entry_date=$7, exit_date=$8, entry_price=$9, exit_price=$10, stop_loss=$11, take_profit=$12,
        position_size=$13, pnl=$14, rr_ratio=$15, risk_percent=$16, notes=$17, lessons_learned=$18,
        screenshot_url=$19, emotion_before=$20, emotion_after=$21, positive_tags=$22, mistake_tags=$23,
        why_entered=$24, what_happened=$25, what_went_well=$26, mistakes_made=$27, setup_description=$28,
        updated_at=CURRENT_TIMESTAMP WHERE id=$29 AND user_id=$30 RETURNING *`,
      [b.status||'CLOSED', b.symbol, marketType, b.direction, b.strategy, b.session,
        entryDate?new Date(entryDate):null, exitDate?new Date(exitDate):null,
        entryPrice, exitPrice, stopLoss, takeProfit,
        positionSize, pnl, rrRatio, riskPercent, notes, lessonsLearned, screenshotUrl,
        emotionBefore, emotionAfter,
        typeof positiveTags === 'string' ? positiveTags : JSON.stringify(positiveTags),
        typeof mistakeTags === 'string' ? mistakeTags : JSON.stringify(mistakeTags),
        whyEntered, whatHappened, whatWentWell, mistakesMade, setupDescription,
        id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Trade not found' });
    console.log('[updateTrade] saved:', { id: result.rows[0].id, pnl: result.rows[0].pnl, risk_percent: result.rows[0].risk_percent });
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
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addTradeMedia = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ success: false, error: 'Файл байхгүй байна' });

    const current = await query('SELECT media_urls FROM trades WHERE id=$1 AND user_id=$2', [id, userId]);
    if (!current.rows[0]) return res.status(404).json({ success: false, error: 'Trade not found' });
    const existing = current.rows[0].media_urls || [];
    if (existing.length >= 3) return res.status(400).json({ success: false, error: 'Хамгийн ихдээ 3 зураг оруулах боломжтой' });

    const url = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: uniquePublicId(userId), resource_type: 'image', overwrite: false,
          transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' }] },
        (err, result) => { if (err) reject(err); else resolve(result.secure_url); }
      ).end(req.file.buffer);
    });

    const result = await query(
      `UPDATE trades SET media_urls = array_append(COALESCE(media_urls, '{}'), $1) WHERE id=$2 AND user_id=$3 RETURNING media_urls`,
      [url, id, userId]
    );
    res.json({ success: true, data: { media_urls: result.rows[0].media_urls, url } });
  } catch (error) {
    console.error('addTradeMedia error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeTradeMedia = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const { url } = req.body;
    const userId = req.user.id;

    // Delete from Cloudinary (non-fatal)
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
      if (match) await cloudinary.uploader.destroy(match[1]);
    } catch {}

    const result = await query(
      `UPDATE trades SET media_urls = array_remove(COALESCE(media_urls, '{}'), $1) WHERE id=$2 AND user_id=$3 RETURNING media_urls`,
      [url, id, userId]
    );
    res.json({ success: true, data: { media_urls: result.rows[0]?.media_urls || [] } });
  } catch (error) {
    console.error('removeTradeMedia error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

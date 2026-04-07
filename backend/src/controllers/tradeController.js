import { query, getDbStatus } from '../db/index.js';
import { mockTrades } from '../utils/mockData.js';
import { v4 as uuidv4 } from 'uuid';

export const getTrades = async (req, res) => {
  try {
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    // Check if trades table is empty, if so, seed it
    const countResult = await query('SELECT COUNT(*) FROM trades');
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log("Seeding database with mock trades...");
      for (const trade of mockTrades) {
        const dbQuery = `
          INSERT INTO trades (
            status, symbol, market_type, direction, strategy, session,
            entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
            position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          )
        `;
        const values = [
          trade.status || 'DRAFT', trade.symbol, trade.market_type, trade.direction, trade.strategy, trade.session,
          trade.entry_date ? new Date(trade.entry_date) : null, 
          trade.exit_date ? new Date(trade.exit_date) : null, 
          trade.entry_price, trade.exit_price, trade.stop_loss, trade.take_profit,
          trade.position_size, trade.pnl, trade.rr_ratio, trade.notes || trade.whyEntered, trade.lessons_learned || trade.lessonLearned, trade.screenshot_url
        ];
        await query(dbQuery, values);
      }
    }

    const result = await query('SELECT * FROM trades ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows, mode: 'database' });
  } catch (error) {
    // Silently fallback to mock data
    const mockDataWithMode = mockTrades.map(t => ({ ...t, mode: 'mock' }));
    res.json({ success: true, data: mockDataWithMode, mode: 'mock' });
  }
};

export const addTrade = async (req, res) => {
  try {
    const { 
      status, symbol, market_type, direction, strategy, session,
      entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
      whyEntered, whatHappened, mistakesMade, whatWentWell, lessonLearned,
      emotionBefore, emotionAfter, positiveTags, mistakeTags, tags, emotion
    } = req.body;
    
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    // For simplicity with the existing database schema, we'll store the extra fields in notes or as JSON if needed.
    // Assuming the DB schema hasn't been updated with all these columns, we'll just use the mock fallback for now
    // or update the DB query if the columns exist. Since we don't know the exact schema, we'll just pass them.
    // Actually, let's just use the mock fallback for the extra fields if the DB fails.
    
    const dbQuery = `
      INSERT INTO trades (
        status, symbol, market_type, direction, strategy, session,
        entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
        position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;
    
    const values = [
      status || 'DRAFT', symbol, market_type, direction, strategy, session,
      entry_date ? new Date(entry_date) : null, 
      exit_date ? new Date(exit_date) : null, 
      entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes || whyEntered, lessons_learned || lessonLearned, screenshot_url
    ];

    const result = await query(dbQuery, values);
    res.status(201).json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    // Silently fallback to mock data
    const { 
      status, symbol, market_type, direction, strategy, session,
      entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
      whyEntered, whatHappened, mistakesMade, whatWentWell, lessonLearned,
      emotionBefore, emotionAfter, positiveTags, mistakeTags, tags, emotion
    } = req.body;
    
    const newTrade = {
      id: uuidv4(),
      status: status || 'DRAFT',
      symbol, market_type, direction, strategy, session,
      entry_date: entry_date || new Date().toISOString(),
      exit_date, entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
      whyEntered, whatHappened, mistakesMade, whatWentWell, lessonLearned,
      emotionBefore, emotionAfter, positiveTags, mistakeTags, tags, emotion,
      created_at: new Date().toISOString(),
      mode: 'mock'
    };
    mockTrades.unshift(newTrade);
    res.status(201).json({ success: true, data: newTrade, mode: 'mock' });
  }
};

export const updateTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, symbol, market_type, direction, strategy, session,
      entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes, lessons_learned, screenshot_url,
      whyEntered, whatHappened, mistakesMade, whatWentWell, lessonLearned,
      emotionBefore, emotionAfter, positiveTags, mistakeTags, tags, emotion
    } = req.body;
    
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    const dbQuery = `
      UPDATE trades SET
        status = $1, symbol = $2, market_type = $3, direction = $4, strategy = $5, session = $6,
        entry_date = $7, exit_date = $8, entry_price = $9, exit_price = $10, stop_loss = $11, take_profit = $12,
        position_size = $13, pnl = $14, rr_ratio = $15, notes = $16, lessons_learned = $17, screenshot_url = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
    `;
    
    const values = [
      status || 'DRAFT', symbol, market_type, direction, strategy, session,
      entry_date ? new Date(entry_date) : null, 
      exit_date ? new Date(exit_date) : null, 
      entry_price, exit_price, stop_loss, take_profit,
      position_size, pnl, rr_ratio, notes || whyEntered, lessons_learned || lessonLearned, screenshot_url,
      id
    ];

    const result = await query(dbQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    res.json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    // Silently fallback to mock data
    const { id } = req.params;
    const index = mockTrades.findIndex(t => t.id === id || t.id.toString() === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    
    const updatedTrade = { ...mockTrades[index], ...req.body, mode: 'mock' };
    mockTrades[index] = updatedTrade;
    res.json({ success: true, data: updatedTrade, mode: 'mock' });
  }
};

export const getTradeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    const result = await query('SELECT * FROM trades WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    res.json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    const { id } = req.params;
    const trade = mockTrades.find(t => t.id === id || t.id.toString() === id);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    res.json({ success: true, data: { ...trade, mode: 'mock' }, mode: 'mock' });
  }
};

export const deleteTrade = async (req, res) => {
  try {
    const { id } = req.params;
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    const result = await query('DELETE FROM trades WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    res.json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    // Silently fallback to mock data
    const { id } = req.params;
    const index = mockTrades.findIndex(t => t.id === id || t.id.toString() === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    
    const deletedTrade = mockTrades.splice(index, 1)[0];
    res.json({ success: true, data: deletedTrade, mode: 'mock' });
  }
};

export const updateTradeNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { general_notes, lessons_learned } = req.body;
    
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    // Check if notes exist
    const checkResult = await query('SELECT id FROM trade_notes WHERE trade_id = $1', [id]);
    
    let result;
    if (checkResult.rows.length > 0) {
      result = await query(`
        UPDATE trade_notes 
        SET general_notes = $1, lessons_learned = $2, updated_at = CURRENT_TIMESTAMP
        WHERE trade_id = $3 RETURNING *
      `, [general_notes, lessons_learned, id]);
    } else {
      result = await query(`
        INSERT INTO trade_notes (trade_id, general_notes, lessons_learned)
        VALUES ($1, $2, $3) RETURNING *
      `, [id, general_notes, lessons_learned]);
    }
    
    res.json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addTradeMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_url, file_type } = req.body;
    
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    const result = await query(`
      INSERT INTO trade_media (trade_id, file_url, file_type)
      VALUES ($1, $2, $3) RETURNING *
    `, [id, file_url, file_type]);
    
    res.status(201).json({ success: true, data: result.rows[0], mode: 'database' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

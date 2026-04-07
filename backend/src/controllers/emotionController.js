import { query, getDbStatus } from '../db/index.js';

export const getEmotions = async (req, res) => {
  try {
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    const result = await query('SELECT * FROM emotion_tags ORDER BY is_default DESC, name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEmotion = async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    
    if (!getDbStatus()) throw new Error("DB_NOT_CONNECTED");
    
    const dbQuery = `
      INSERT INTO emotion_tags (name, emoji, color, is_default) 
      VALUES ($1, $2, $3, false) RETURNING *
    `;
    
    const result = await query(dbQuery, [name, emoji, color]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

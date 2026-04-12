import { query, getDbStatus } from '../db/index.js';

export const getEmotions = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const result = await query('SELECT * FROM emotion_tags ORDER BY is_default DESC, name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getEmotions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEmotion = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const { name, emoji, color } = req.body;
    const result = await query(
      'INSERT INTO emotion_tags (user_id, name, emoji, color, is_default) VALUES ($1,$2,$3,$4,false) RETURNING *',
      [userId, name, emoji, color]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createEmotion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

import { query, getDbStatus } from '../config/database.js';

export const getEmotions = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const subtype = req.query.subtype || null;

    const result = await query(
      `SELECT * FROM emotion_tags
       WHERE is_default = true
          OR (user_id = $1 AND ($2::varchar IS NULL OR subtype = $2 OR subtype IS NULL))
       ORDER BY is_default DESC, name ASC`,
      [userId, subtype]
    );
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
    const { name, emoji, color, subtype } = req.body;
    const result = await query(
      'INSERT INTO emotion_tags (user_id, name, emoji, color, is_default, subtype) VALUES ($1,$2,$3,$4,false,$5) RETURNING *',
      [userId, name, emoji, color, subtype || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createEmotion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteEmotion = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const userId = req.user.id;
    const result = await query(
      'DELETE FROM emotion_tags WHERE id=$1 AND user_id=$2 AND is_default=false RETURNING id',
      [id, userId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Emotion not found or cannot be deleted' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

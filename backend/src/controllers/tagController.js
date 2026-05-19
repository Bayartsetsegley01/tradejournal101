import { query, getDbStatus } from '../config/database.js';

export const getTags = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const result = await query('SELECT * FROM tag_definitions ORDER BY is_default DESC, name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getTags error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTag = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const userId = req.user.id;
    const { name, label, type, color } = req.body;
    const result = await query(
      'INSERT INTO tag_definitions (user_id, name, type, color, is_default) VALUES ($1,$2,$3,$4,false) RETURNING *',
      [userId, name || label, type, color]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createTag error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTag = async (req, res) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not connected' });
    const { id } = req.params;
    const userId = req.user.id;
    const result = await query(
      'DELETE FROM tag_definitions WHERE id=$1 AND user_id=$2 AND is_default=false RETURNING id',
      [id, userId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Tag not found or cannot be deleted' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

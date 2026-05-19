import { query, getDbStatus } from '../config/database.js';

const dbCheck = (res) => {
  if (!getDbStatus()) { res.status(503).json({ success: false, error: 'DB not connected' }); return false; }
  return true;
};

// GET /api/ai/sessions
export const getSessions = async (req, res) => {
  try {
    if (!dbCheck(res)) return;
    const result = await query(
      `SELECT id, title, created_at, updated_at
       FROM chat_sessions WHERE user_id=$1
       ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

// POST /api/ai/sessions
export const createSession = async (req, res) => {
  try {
    if (!dbCheck(res)) return;
    const { title = 'Шинэ чат' } = req.body;
    const result = await query(
      `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at`,
      [req.user.id, String(title).slice(0, 255)]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

// GET /api/ai/sessions/:id/messages
export const getMessages = async (req, res) => {
  try {
    if (!dbCheck(res)) return;
    const { id } = req.params;
    const own = await query(
      `SELECT id FROM chat_sessions WHERE id=$1 AND user_id=$2`,
      [id, req.user.id]
    );
    if (!own.rows.length) return res.status(404).json({ success: false, error: 'Session not found' });
    const result = await query(
      `SELECT id, role, content, created_at FROM chat_messages WHERE session_id=$1 ORDER BY created_at ASC`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

// DELETE /api/ai/sessions/:id
export const deleteSession = async (req, res) => {
  try {
    if (!dbCheck(res)) return;
    const { id } = req.params;
    const result = await query(
      `DELETE FROM chat_sessions WHERE id=$1 AND user_id=$2 RETURNING id`,
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

// POST /api/ai/sessions/:id/messages
export const saveMessage = async (req, res) => {
  try {
    if (!dbCheck(res)) return;
    const { id } = req.params;
    const { role, content } = req.body;
    if (!['user','assistant'].includes(role) || !content?.trim()) {
      return res.status(400).json({ success: false, error: 'role and content required' });
    }
    const own = await query(
      `SELECT id FROM chat_sessions WHERE id=$1 AND user_id=$2`,
      [id, req.user.id]
    );
    if (!own.rows.length) return res.status(404).json({ success: false, error: 'Session not found' });

    const result = await query(
      `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING id, created_at`,
      [id, role, content.trim()]
    );
    await query(`UPDATE chat_sessions SET updated_at=NOW() WHERE id=$1`, [id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

// PATCH /api/ai/sessions/:id  (update title)
export const updateSession = async (req, res) => {
  try {
    if (!dbCheck(res)) return;
    const { id } = req.params;
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, error: 'title required' });
    const result = await query(
      `UPDATE chat_sessions SET title=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING id, title`,
      [String(title).slice(0, 255), id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

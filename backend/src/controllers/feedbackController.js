import { query } from '../db/index.js';

export const submitFeedback = async (req, res) => {
  try {
    const { type = 'general', message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const allowedTypes = ['bug', 'feature', 'general', 'complaint'];
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const userId = req.user?.id || null;
    const userName = req.user?.name || req.body.name || null;
    const userEmail = req.user?.email || req.body.email || null;

    const result = await query(
      'INSERT INTO feedback (user_id, user_name, user_email, type, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, userName, userEmail, type, message.trim()]
    );

    res.status(201).json({ message: 'Feedback submitted', id: result.rows[0].id });
  } catch (err) {
    console.error('submitFeedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

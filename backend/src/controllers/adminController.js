import { query } from '../db/index.js';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role != 'admin')::int                                          AS total_users,
        (SELECT COUNT(*) FROM users WHERE role != 'admin' AND is_active = true)::int                    AS active_users,
        (SELECT COUNT(*) FROM users WHERE role != 'admin' AND is_active = false)::int                   AS inactive_users,
        (SELECT COUNT(*) FROM users WHERE role != 'admin' AND created_at >= NOW() - INTERVAL '7 days')::int AS new_users_week,
        (SELECT COUNT(*) FROM trades)::int                                                               AS total_trades,
        (SELECT COUNT(*) FROM trades WHERE created_at >= NOW() - INTERVAL '7 days')::int                AS trades_this_week,
        (SELECT COUNT(*) FROM feedback WHERE status = 'new')::int                                       AS pending_feedback
    `);

    const topAssets = await query(`
      SELECT market_type,
        COUNT(*)::int                                                     AS trade_count,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END)::int                   AS wins,
        SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END)::int                   AS losses,
        ROUND(COALESCE(SUM(pnl), 0)::numeric, 2)                        AS total_pnl
      FROM trades
      WHERE market_type IS NOT NULL
      GROUP BY market_type
      ORDER BY trade_count DESC
      LIMIT 6
    `);

    const registrationTrend = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        COUNT(*)::int AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months' AND role != 'admin'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const tradingTrend = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        COUNT(*)::int AS count
      FROM trades
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    res.json({
      stats: stats.rows[0],
      topAssets: topAssets.rows,
      registrationTrend: registrationTrend.rows,
      tradingTrend: tradingTrend.rows,
    });
  } catch (err) {
    console.error('Admin getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = ["u.role != 'admin'"];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (status === 'active') conditions.push('u.is_active = true');
    if (status === 'inactive') conditions.push('u.is_active = false');

    const where = conditions.join(' AND ');
    const allowedSort = { created_at: 'u.created_at', name: 'u.name', email: 'u.email', last_login_at: 'u.last_login_at', trades: 'trade_count' };
    const sortCol = allowedSort[sort] || 'u.created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const countParams = [...params];
    params.push(parseInt(limit), offset);

    const [usersResult, countResult] = await Promise.all([
      query(`
        SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
               u.last_login_at, u.auth_provider, u.avatar_url,
               COUNT(t.id)::int AS trade_count
        FROM users u
        LEFT JOIN trades t ON t.user_id = u.id
        WHERE ${where}
        GROUP BY u.id
        ORDER BY ${sortCol} ${sortDir}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params),
      query(`SELECT COUNT(*)::int AS total FROM users u WHERE ${where}`, countParams),
    ]);

    res.json({
      users: usersResult.rows,
      total: countResult.rows[0].total,
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Admin getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active required' });

    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND role != $3 RETURNING id, name, email, is_active',
      [is_active, id, 'admin']
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Admin updateUserStatus error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM users WHERE id = $1 AND role != 'admin' RETURNING id",
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Admin deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ─── Feedback Management ──────────────────────────────────────────────────────

export const getFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`f.status = $${params.length}`); }
    if (type) { params.push(type); conditions.push(`f.type = $${params.length}`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countParams = [...params];
    params.push(parseInt(limit), offset);

    const [feedbackResult, countResult] = await Promise.all([
      query(`
        SELECT f.*, u.name AS submitter_name
        FROM feedback f
        LEFT JOIN users u ON u.id = f.user_id
        ${where}
        ORDER BY f.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `, params),
      query(`SELECT COUNT(*)::int AS total FROM feedback f ${where}`, countParams),
    ]);

    res.json({
      feedback: feedbackResult.rows,
      total: countResult.rows[0].total,
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Admin getFeedback error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['new', 'reviewed', 'resolved'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await query(
      'UPDATE feedback SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ feedback: result.rows[0] });
  } catch (err) {
    console.error('Admin updateFeedbackStatus error:', err);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    await query('DELETE FROM feedback WHERE id = $1', [req.params.id]);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    console.error('Admin deleteFeedback error:', err);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};

// ─── App Config ───────────────────────────────────────────────────────────────

export const getConfig = async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM app_config');
    const config = Object.fromEntries(result.rows.map(r => [r.key, r.value]));
    res.json({ config });
  } catch (err) {
    console.error('Admin getConfig error:', err);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });

    await query(
      'INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [key, String(value)]
    );
    res.json({ message: 'Config updated', key, value });
  } catch (err) {
    console.error('Admin updateConfig error:', err);
    res.status(500).json({ error: 'Failed to update config' });
  }
};

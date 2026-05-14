import { query } from '../config/database.js';
import crypto from 'crypto';
import MetaApi from 'metaapi.cloud-sdk';

// ── API Key (EA sync) ─────────────────────────────────────────────────────────

export const getApiKey = async (req, res) => {
  try {
    const result = await query('SELECT mt5_api_key FROM users WHERE id=$1', [req.user.id]);
    res.json({ success: true, data: { api_key: result.rows[0]?.mt5_api_key || null } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const generateApiKey = async (req, res) => {
  try {
    const key = crypto.randomBytes(32).toString('hex');
    await query('UPDATE users SET mt5_api_key=$1 WHERE id=$2', [key, req.user.id]);
    res.json({ success: true, data: { api_key: key } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const syncTrade = async (req, res) => {
  try {
    const t = req.body;
    const symbol = (t.symbol || '').trim();
    if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });
    const direction = (t.direction || '').toUpperCase();
    if (!['LONG', 'SHORT'].includes(direction))
      return res.status(400).json({ success: false, error: 'direction must be LONG or SHORT' });

    const result = await query(
      `INSERT INTO trades
         (user_id, status, symbol, direction, entry_price, exit_price,
          position_size, pnl, entry_date, exit_date, notes, market_type)
       VALUES ($1,'CLOSED',$2,$3,$4,$5,$6,$7,$8,$9,$10,'FOREX') RETURNING id`,
      [req.userId, symbol, direction,
       parseFloat(t.entry_price) || null, parseFloat(t.exit_price) || null,
       parseFloat(t.volume) || null, parseFloat(t.pnl) ?? null,
       t.entry_date ? new Date(t.entry_date.replace(/\./g, '-')) : null,
       t.exit_date  ? new Date(t.exit_date.replace(/\./g, '-'))  : null,
       (t.comment || '').trim() || null]
    );
    res.status(201).json({ success: true, data: { id: result.rows[0].id } });
  } catch (e) {
    console.error('MT5 EA sync error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

// ── MetaApi Cloud ─────────────────────────────────────────────────────────────

const getMetaApi = () => {
  if (!process.env.METAAPI_TOKEN) throw new Error('METAAPI_TOKEN тохиргоогүй байна');
  return new MetaApi(process.env.METAAPI_TOKEN);
};

export const connectMetaApi = async (req, res) => {
  const { login, password, server } = req.body;
  const userId = req.user.id;

  if (!login || !password || !server) {
    return res.status(400).json({ success: false, error: 'Login, investor password, server оруулна уу' });
  }

  try {
    const api = getMetaApi();
    const existing = await query('SELECT mt5_account_id FROM users WHERE id=$1', [userId]);
    const existingId = existing.rows[0]?.mt5_account_id;

    let account = null;
    if (existingId) {
      try {
        account = await api.metatraderAccountApi.getAccount(existingId);
        if (['DELETING', 'DELETED'].includes(account.state)) account = null;
      } catch { account = null; }
    }

    if (!account) {
      account = await api.metatraderAccountApi.createAccount({
        name: `TJ_${userId.toString().slice(0, 8)}`,
        type: 'cloud',
        login: String(login),
        password: String(password),
        server: String(server),
        platform: 'mt5',
        magic: 0,
      });
    } else {
      try { await account.update({ login: String(login), password: String(password), server: String(server) }); } catch {}
    }

    await query(
      'UPDATE users SET mt5_account_id=$1, mt5_login=$2, mt5_server=$3 WHERE id=$4',
      [account.id, String(login), String(server), userId]
    );

    // Start deploying without waiting
    account.deploy().catch(e => console.error('[MetaApi] deploy error:', e));

    res.json({ success: true, data: { account_id: account.id, state: account.state } });
  } catch (e) {
    console.error('[MetaApi] connect error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getMetaApiStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query('SELECT mt5_account_id, mt5_login, mt5_server FROM users WHERE id=$1', [userId]);
    const { mt5_account_id, mt5_login, mt5_server } = result.rows[0] || {};
    if (!mt5_account_id) return res.json({ success: true, data: { connected: false } });

    const api = getMetaApi();
    const account = await api.metatraderAccountApi.getAccount(mt5_account_id);
    res.json({ success: true, data: {
      connected: true,
      state: account.state,
      connectionStatus: account.connectionStatus,
      login: mt5_login,
      server: mt5_server,
    }});
  } catch {
    res.json({ success: true, data: { connected: false } });
  }
};

export const syncMetaApiHistory = async (req, res) => {
  const userId = req.user.id;
  const months = parseInt(req.body.months || 3);

  const userResult = await query('SELECT mt5_account_id FROM users WHERE id=$1', [userId]);
  const accountId = userResult.rows[0]?.mt5_account_id;
  if (!accountId) return res.status(400).json({ success: false, error: 'MT5 холбогдоогүй байна' });

  try {
    const api = getMetaApi();
    const account = await api.metatraderAccountApi.getAccount(accountId);

    if (account.state !== 'DEPLOYED') await account.deploy();

    await Promise.race([
      account.waitConnected(),
      new Promise((_, r) => setTimeout(() => r(new Error('Холболтын хугацаа дууслаа (60s). Дахин оролдоно уу.')), 60000))
    ]);

    const startTime = new Date();
    startTime.setMonth(startTime.getMonth() - months);

    const connection = account.getRPCConnection();
    await connection.connect();
    await Promise.race([
      connection.waitSynchronized({ timeoutInSeconds: 30 }),
      new Promise((_, r) => setTimeout(() => r(new Error('Sync timeout')), 35000))
    ]);

    const history = await connection.getDealsByTimeRange(startTime, new Date());
    await connection.close();

    const deals = (history.deals || []).filter(d =>
      d.type === 'DEAL_TYPE_BUY' || d.type === 'DEAL_TYPE_SELL'
    );
    const outDeals = deals.filter(d => d.entryType === 'DEAL_ENTRY_OUT');
    const inDeals  = deals.filter(d => d.entryType === 'DEAL_ENTRY_IN');

    let imported = 0;
    const errors = [];

    for (const ex of outDeals) {
      try {
        const en = inDeals.find(d => d.positionId === ex.positionId);
        // exit SELL = was LONG; exit BUY = was SHORT
        const direction = ex.type === 'DEAL_TYPE_SELL' ? 'LONG' : 'SHORT';
        const pnl = (ex.profit || 0) + (ex.commission || 0) + (ex.swap || 0);

        await query(
          `INSERT INTO trades
             (user_id, status, symbol, direction, entry_price, exit_price,
              position_size, pnl, entry_date, exit_date, stop_loss, take_profit, market_type)
           VALUES ($1,'CLOSED',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'FOREX')`,
          [userId, ex.symbol, direction,
           en?.price ?? null, ex.price ?? null,
           ex.volume ?? null, pnl,
           en?.time  ?? null, ex.time ?? null,
           en?.sl ?? ex.sl ?? null, en?.tp ?? ex.tp ?? null]
        );
        imported++;
      } catch (e) {
        errors.push({ symbol: ex.symbol, error: e.message });
      }
    }

    res.json({ success: true, data: { imported, total: outDeals.length, errors: errors.slice(0, 5) } });
  } catch (e) {
    console.error('[MetaApi] sync error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

export const disconnectMetaApi = async (req, res) => {
  const userId = req.user.id;
  const result = await query('SELECT mt5_account_id FROM users WHERE id=$1', [userId]);
  const accountId = result.rows[0]?.mt5_account_id;

  if (accountId) {
    try {
      const api = getMetaApi();
      const account = await api.metatraderAccountApi.getAccount(accountId);
      await account.undeploy();
      await account.remove();
    } catch (e) { console.error('[MetaApi] disconnect error:', e); }
  }

  await query('UPDATE users SET mt5_account_id=NULL, mt5_login=NULL, mt5_server=NULL WHERE id=$1', [userId]);
  res.json({ success: true });
};

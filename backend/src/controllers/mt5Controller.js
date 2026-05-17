import { query } from '../config/database.js';
import crypto from 'crypto';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const MetaApi = _require('metaapi.cloud-sdk').default;

const getMetaApi = () => {
  if (!process.env.METAAPI_TOKEN) throw new Error('METAAPI_TOKEN тохиргоогүй байна');
  return new MetaApi(process.env.METAAPI_TOKEN);
};

const cleanError = (msg = '') => {
  const m = msg.toLowerCase();
  if (m.includes('high reliability') || m.includes('top up'))
    return 'AUTO_SYNC_UNAVAILABLE';
  if (m.includes('already') || m.includes('exist'))
    return 'Энэ данс аль хэдийн бүртгэлтэй байна';
  if (m.includes('timed out') || m.includes('timeout') || m.includes('synchronize') || m.includes('хугацаа'))
    return 'MetaApi холболтын хугацаа дууслаа. Broker сервер хариу өгөхгүй байна. 5–10 минутын дараа дахин оролдоно уу';
  if (m.includes('invalid') || m.includes('unauthorized') || m.includes('wrong password') || m.includes('401'))
    return 'Нэвтрэх мэдээлэл буруу байна. MT5 Login эсвэл Investor Password шалгана уу';
  if (m.includes('not found') || m.includes('404'))
    return 'Сервер эсвэл данс олдсонгүй. Server нэрийг шалгана уу';
  if (m.includes('network') || m.includes('econnrefused') || m.includes('enotfound'))
    return 'Сүлжээний алдаа. Интернет холболтоо шалгаад дахин оролдоно уу';
  if (m.includes('deploy') || m.includes('undeploy'))
    return 'MetaApi данс идэвхжүүлэхэд алдаа гарлаа. Дахин оролдоно уу';
  if (m.includes('permission') || m.includes('forbidden') || m.includes('403'))
    return 'Хандах эрх байхгүй байна. Investor Password зөв эсэхийг шалгана уу';
  return 'Синхрончлоход алдаа гарлаа. Дахин оролдоно уу';
};

const timeAgo = (ms) => {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Саяхан';
  if (m < 60) return `${m}м өмнө`;
  if (m < 1440) return `${Math.floor(m / 60)}ц өмнө`;
  return `${Math.floor(m / 1440)}ө өмнө`;
};

// ── Auto-Sync: Connect ────────────────────────────────────────────────────────

export const connectAccount = async (req, res) => {
  const { login, investorPassword, server } = req.body;
  const userId = req.user.id;

  if (!login || !investorPassword || !server) {
    return res.status(400).json({ success: false, error: 'login, investorPassword, server шаардлагатай' });
  }

  try {
    // Return existing DB entry if user already connected this login+server
    const existing = await query(
      'SELECT * FROM mt5_accounts WHERE user_id=$1 AND login=$2 AND server=$3 LIMIT 1',
      [userId, String(login), String(server)]
    );
    if (existing.rows[0]) {
      return res.json({ success: true, data: existing.rows[0] });
    }

    const api = getMetaApi();

    let account;
    try {
      account = await api.metatraderAccountApi.createAccount({
        name: `TJ_${userId.toString().slice(0, 8)}_${Date.now()}`,
        type: 'cloud',
        login: String(login),
        password: String(investorPassword),
        server: String(server),
        platform: 'mt5',
        magic: 0,
        reliability: 'regular',
      });
    } catch (createErr) {
      // MetaApi account already registered — find and reuse or recreate
      const errMsg = createErr.message || '';
      if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('exist')) {
        const allAccounts = await api.metatraderAccountApi.getAccounts({});
        const found = allAccounts.find(
          a => String(a.login) === String(login) && a.server === String(server)
        );
        if (!found) throw new Error('already');

        // If the existing account has high reliability (requires paid plan), remove and recreate as regular
        const rel = String(found.reliability || '').toLowerCase();
        if (rel.includes('high')) {
          console.log('[MetaApi] Removing high-reliability account, recreating as regular...');
          try { await found.undeploy(); } catch {}
          await new Promise(r => setTimeout(r, 3000));
          await found.remove();
          account = await api.metatraderAccountApi.createAccount({
            name: `TJ_${userId.toString().slice(0, 8)}_${Date.now()}`,
            type: 'cloud',
            login: String(login),
            password: String(investorPassword),
            server: String(server),
            platform: 'mt5',
            magic: 0,
            reliability: 'regular',
          });
        } else {
          account = found;
        }
      } else {
        throw createErr;
      }
    }

    const result = await query(
      `INSERT INTO mt5_accounts (user_id, account_id, login, server, sync_type, status)
       VALUES ($1,$2,$3,$4,'AUTO','CONNECTING') RETURNING *`,
      [userId, account.id, String(login), String(server)]
    );

    // Deploy async — don't block the response
    account.deploy().catch(e => console.error('[MetaApi] deploy error:', e));

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('[MetaApi] connect error:', e);
    res.status(500).json({ success: false, error: cleanError(e.message) });
  }
};

// ── Auto-Sync: Sync trades (background — avoids Render 30s HTTP timeout) ────────

export const syncAccount = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.id;
  const months = parseInt(req.body?.months || req.query?.months || 3);

  const accountResult = await query(
    'SELECT * FROM mt5_accounts WHERE id=$1 AND user_id=$2',
    [accountId, userId]
  );
  if (!accountResult.rows[0]) {
    return res.status(404).json({ success: false, error: 'Данс олдсонгүй' });
  }

  // Mark as SYNCING and respond immediately — actual work runs in background
  await query(`UPDATE mt5_accounts SET status='SYNCING' WHERE id=$1`, [accountId]);
  res.json({ success: true, data: { status: 'SYNCING' } });

  // Background sync — runs after HTTP response is sent
  _runSync(accountId, userId, accountResult.rows[0], months);
};

async function _runSync(accountId, userId, dbAccount, months) {
  try {
    const api = getMetaApi();
    const account = await api.metatraderAccountApi.getAccount(dbAccount.account_id);

    // High-reliability accounts require a paid MetaApi plan — fail fast with clear error
    const rel = String(account.reliability || '').toLowerCase();
    if (rel.includes('high')) {
      throw new Error('HIGH_RELIABILITY');
    }

    if (account.state !== 'DEPLOYED') await account.deploy();

    const startTime = new Date();
    startTime.setMonth(startTime.getMonth() - months);

    const connection = account.getRPCConnection();
    await connection.connect();
    await Promise.race([
      connection.waitSynchronized({ timeoutInSeconds: 300 }),
      new Promise((_, r) => setTimeout(() => r(new Error('Sync timeout 300с')), 310000)),
    ]);

    const history = await connection.getDealsByTimeRange(startTime, new Date());
    await connection.close();

    const deals = (history.deals || []).filter(d =>
      d.type === 'DEAL_TYPE_BUY' || d.type === 'DEAL_TYPE_SELL'
    );
    const outDeals = deals.filter(d => d.entryType === 'DEAL_ENTRY_OUT');
    const inDeals  = deals.filter(d => d.entryType === 'DEAL_ENTRY_IN');

    let imported = 0;
    let skipped  = 0;

    for (const ex of outDeals) {
      try {
        const en = inDeals.find(d => d.positionId === ex.positionId);
        const direction = ex.type === 'DEAL_TYPE_SELL' ? 'LONG' : 'SHORT';
        const pnl = (ex.profit || 0) + (ex.commission || 0) + (ex.swap || 0);
        const entryDate = en?.time ? new Date(en.time) : null;
        const exitDate  = ex.time  ? new Date(ex.time)  : null;

        if (entryDate && exitDate) {
          const dup = await query(
            `SELECT id FROM trades WHERE user_id=$1 AND symbol=$2 AND direction=$3
             AND entry_date=$4 AND exit_date=$5 LIMIT 1`,
            [userId, ex.symbol, direction, entryDate, exitDate]
          );
          if (dup.rows[0]) { skipped++; continue; }
        }

        await query(
          `INSERT INTO trades
             (user_id, account_id, status, symbol, direction, entry_price, exit_price,
              position_size, pnl, entry_date, exit_date, stop_loss, take_profit, market_type)
           VALUES ($1,$2,'CLOSED',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'FOREX')`,
          [userId, accountId, ex.symbol, direction,
           en?.price ?? null, ex.price ?? null,
           ex.volume ?? null, pnl,
           entryDate, exitDate,
           en?.sl ?? ex.sl ?? null, en?.tp ?? ex.tp ?? null]
        );
        imported++;
      } catch (e) {
        console.error('[MetaApi] trade insert:', e.message);
      }
    }

    await query(
      `UPDATE mt5_accounts SET status='CONNECTED', last_synced_at=NOW() WHERE id=$1`,
      [accountId]
    );
    console.log(`[MetaApi] sync done — imported:${imported} skipped:${skipped}`);
  } catch (e) {
    console.error('[MetaApi] background sync error:', e.message);
    await query(
      `UPDATE mt5_accounts SET status='ERROR', last_sync_error=$2 WHERE id=$1`,
      [accountId, cleanError(e.message)]
    ).catch(() => {});
  }
}

// ── Get connected accounts ────────────────────────────────────────────────────

export const getAccounts = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, login, server, sync_type, status, last_synced_at, last_sync_error, created_at
       FROM mt5_accounts WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// ── Delete connected account ──────────────────────────────────────────────────

export const deleteAccount = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const accountResult = await query(
    'SELECT * FROM mt5_accounts WHERE id=$1 AND user_id=$2',
    [id, userId]
  );
  if (!accountResult.rows[0]) {
    return res.status(404).json({ success: false, error: 'Данс олдсонгүй' });
  }

  if (accountResult.rows[0].account_id) {
    try {
      const api = getMetaApi();
      const account = await api.metatraderAccountApi.getAccount(accountResult.rows[0].account_id);
      await account.undeploy();
      await account.remove();
    } catch (e) { console.error('[MetaApi] remove error:', e); }
  }

  await query('DELETE FROM mt5_accounts WHERE id=$1', [id]);
  res.json({ success: true });
};

// ── EA Sync (real-time push via API key auth) ─────────────────────────────────

export const eaSyncTrade = async (req, res) => {
  try {
    const t = req.body;
    const symbol = (t.symbol || '').trim();
    if (!symbol) return res.status(400).json({ success: false, error: 'symbol шаардлагатай' });

    const direction = (t.direction || '').toUpperCase();
    if (!['LONG', 'SHORT'].includes(direction))
      return res.status(400).json({ success: false, error: 'direction нь LONG эсвэл SHORT байна' });

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
    console.error('EA sync error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

// ── EA API key management ─────────────────────────────────────────────────────

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

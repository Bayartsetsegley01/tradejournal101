import { query, getDbStatus } from '../config/database.js';

const VALID_DIRECTIONS = new Set(['LONG', 'SHORT']);
const VALID_STATUSES   = new Set(['OPEN', 'CLOSED', 'PLANNED']);

// ── normalizeKey ──────────────────────────────────────────────────────────────
// "Profit/Loss" → "profit loss",  "Entry Window (New York Time)" → "entry window new york time"
const normalizeKey = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

// ── Field aliases ─────────────────────────────────────────────────────────────
const FIELD_ALIASES = {
  symbol:          ['symbol','pair','pairs','ticker','instrument','asset','currency pair','forex pair'],
  direction:       ['direction','side','type','trade type','position type','position side','buy sell'],
  status:          ['status','state','trade status'],
  entry_date:      ['date','entry date','open date','trade date','datetime','time','entry datetime',
                    'entry time','opened','open time','open'],
  exit_date:       ['exit date','close date','exit datetime','close time','exit time','closed','closing date'],
  entry_price:     ['entry','entry price','open price','opening price','entry level','entry price usd'],
  exit_price:      ['exit','exit price','close price','closing price','exit level','exit price usd'],
  stop_loss:       ['stop loss','sl','stop','stoploss','s l','s/l','stop loss price'],
  take_profit:     ['take profit','tp','target','takeprofit','t p','t/p','take profit price','target price'],
  position_size:   ['quantity','size','lot','lots','position size','volume','lot size','units',
                    'shares','contracts'],
  risk_percent:    ['risk','risk percent','risk pct','risk%','risk amount','risk %'],
  pnl:             ['pnl','profit','p l','p and l','profit loss','profit and loss','profit/loss',
                    'pl','gain loss','result','p&l','realized pnl','net pnl','net profit'],
  rr_ratio:        ['r r','rr','r/r','r r ratio','risk reward','risk reward ratio','risk/reward'],
  strategy:        ['strategy','setup','strategy name','model','trading model','system',
                    'trading strategy'],
  session:         ['session','market session','entry window','entry window new york time',
                    'entry window new york','trading session','market time'],
  market_type:     ['market','market type','asset class','instrument type'],
  emotion_before:  ['emotion before','psychology','mood before','pre trade emotion','emotion',
                    'feeling before'],
  emotion_after:   ['emotion after','mood after','post trade emotion','feeling after'],
  positive_tags:   ['positive tags','positives','good tags','followed rules','what went well',
                    'strengths','positive'],
  mistake_tags:    ['negative tags','mistakes','bad tags','errors','what went wrong',
                    'mistake tags','negatives','negative'],
  why_entered:     ['why entered','reason','entry reason','reason for entry','setup reason',
                    'why i entered','trade rationale','why'],
  what_happened:   ['what happened','trade notes','execution notes','trade summary','summary'],
  lessons_learned: ['lesson learned','lessons learned','lesson','lessons','takeaway',
                    'key takeaway','learning','lessons_learned'],
  notes:           ['note','notes','comment','comments','description','rating',
                    'rating 1 5','rating(1 5)','additional notes','misc'],
};

// Pre-build reverse lookup: normalized alias → field name (first match wins)
const ALIAS_LOOKUP = Object.entries(FIELD_ALIASES).reduce((acc, [field, aliases]) => {
  aliases.forEach(a => { if (!acc[a]) acc[a] = field; });
  return acc;
}, {});

// ── parseDate ─────────────────────────────────────────────────────────────────
// Handles: Excel serial, "January 8, 2026", "01/08/2026", "08.01.2026",
//          "2026.01.08", "2026-01-08", MT5 "2026.01.08 14:30", ISO.
export const parseDate = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).trim();
  if (!s) return null;

  // Excel serial number: pure integer or float in plausible range (1 Jan 1900 – 31 Dec 2100)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const num = parseFloat(s);
    if (num > 1 && num < 73051) {               // 73051 = 31 Dec 2099
      const d = new Date(Math.round((num - 25569) * 86400000));
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  // "January 8, 2026"
  const namedMonth = s.match(/^([a-z]+)\s+(\d{1,2}),?\s*(\d{4})$/i);
  if (namedMonth) {
    const d = new Date(`${namedMonth[1]} ${namedMonth[2]}, ${namedMonth[3]}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // MT5 / Mongolian: "2026.01.08 14:30" or "2026.01.08"
  const yyyyDotTime = s.match(/^(\d{4})\.(\d{2})\.(\d{2})(?:\s+(\d{2}:\d{2}))?/);
  if (yyyyDotTime) {
    const iso = `${yyyyDotTime[1]}-${yyyyDotTime[2]}-${yyyyDotTime[3]}${yyyyDotTime[4] ? 'T' + yyyyDotTime[4] + ':00' : ''}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // DD.MM.YYYY (European)
  const euDot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (euDot) {
    const d = new Date(`${euDot[3]}-${euDot[2]}-${euDot[1]}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // MM/DD/YYYY (US)
  const usSlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usSlash) {
    const d = new Date(`${usSlash[3]}-${usSlash[1].padStart(2,'0')}-${usSlash[2].padStart(2,'0')}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // ISO 8601 and any other JS-parseable format
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();

  return null;
};

// ── parseNumber ───────────────────────────────────────────────────────────────
// Handles: "1,234.50" → 1234.50, "(100)" → -100, "" → null
export const parseNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).trim();
  if (!s) return null;

  // Parentheses notation for negatives: "(1,234.50)" → -1234.50
  const parenMatch = s.match(/^\(([0-9,. ]+)\)$/);
  if (parenMatch) {
    const n = parseFloat(parenMatch[1].replace(/,/g, ''));
    return isNaN(n) ? null : -n;
  }

  // Strip thousands separators (comma before 3 digits) and spaces
  const cleaned = s.replace(/,(?=\d{3}(\D|$))/g, '').replace(/\s/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

// ── parseTags ─────────────────────────────────────────────────────────────────
// "perfect-entry, well-managed" → ["perfect-entry","well-managed"]
// Also handles JSON array strings and pipe-separated values.
export const parseTags = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(t => String(t).trim()).filter(Boolean);
  const s = String(val).trim();
  if (!s) return [];
  if (s.startsWith('[')) { try { return JSON.parse(s); } catch {} }
  return s.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
};

// ── normalizeDirection ────────────────────────────────────────────────────────
const normalizeDirection = (val) => {
  const v = String(val || '').trim().toUpperCase();
  if (v === 'BUY'  || v === 'LONG'  || v === 'L') return 'LONG';
  if (v === 'SELL' || v === 'SHORT' || v === 'S') return 'SHORT';
  return v;
};

// ── normalizeRow ──────────────────────────────────────────────────────────────
// Maps ANY object (original CSV column names or already-standard names) to
// a fully-typed trade row ready for DB insertion.
export const normalizeRow = (raw) => {
  // Build a field→value map by checking each key against ALIAS_LOOKUP
  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    const nk = normalizeKey(key);
    const field = ALIAS_LOOKUP[nk];
    if (field && result[field] === undefined) {
      result[field] = value; // first matching column wins
    }
  }

  return {
    symbol:          String(result.symbol || '').trim(),
    direction:       normalizeDirection(result.direction),
    status:          VALID_STATUSES.has(String(result.status || '').trim().toUpperCase())
                       ? String(result.status).trim().toUpperCase()
                       : 'CLOSED',
    entry_date:      parseDate(result.entry_date),
    exit_date:       parseDate(result.exit_date),
    entry_price:     parseNumber(result.entry_price),
    exit_price:      parseNumber(result.exit_price),
    stop_loss:       parseNumber(result.stop_loss),
    take_profit:     parseNumber(result.take_profit),
    position_size:   parseNumber(result.position_size),
    risk_percent:    parseNumber(result.risk_percent),
    pnl:             parseNumber(result.pnl),
    rr_ratio:        parseNumber(result.rr_ratio),
    strategy:        String(result.strategy || '').trim() || null,
    session:         String(result.session  || '').trim() || null,
    market_type:     String(result.market_type || '').trim() || inferMarketType(String(result.symbol || '').trim()) || null,
    emotion_before:  String(result.emotion_before || '').trim() || null,
    emotion_after:   String(result.emotion_after  || '').trim() || null,
    positive_tags:   parseTags(result.positive_tags),
    mistake_tags:    parseTags(result.mistake_tags),
    why_entered:     String(result.why_entered     || '').trim() || null,
    what_happened:   String(result.what_happened   || '').trim() || null,
    lessons_learned: String(result.lessons_learned || '').trim() || null,
    notes:           String(result.notes           || '').trim() || null,
  };
};

// ── inferMarketType ───────────────────────────────────────────────────────────
const inferMarketType = (symbol) => {
  if (!symbol) return null;
  const s = symbol.toUpperCase().trim();

  const cryptoSymbols = ['BTC','ETH','BNB','XRP','SOL','ADA','DOGE','DOT','AVAX','MATIC',
    'LINK','UNI','LTC','BCH','ATOM','FIL','TRX','NEAR','ALGO','VET'];
  if (cryptoSymbols.some(c => s.startsWith(c) || s.includes(c + 'USD') || s.includes(c + 'USDT')))
    return 'crypto';

  const indexSymbols = ['SPX','SPY','QQQ','DJI','NAS','NDX','RUT','VIX','US30','US500','US100'];
  if (indexSymbols.some(i => s.includes(i))) return 'index';

  const commodities = ['XAUUSD','GOLD','XAGUSD','SILVER','USOIL','UKOIL','WTI','BRENT','NGAS','COPPER'];
  if (commodities.some(c => s === c || s.includes(c))) return 'commodity';

  const forexCurrencies = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','SGD','HKD','NOK','SEK','DKK'];
  const isForex = s.length === 6 &&
    forexCurrencies.some(c => s.startsWith(c)) &&
    forexCurrencies.some(c => s.endsWith(c));
  if (isForex) return 'forex';

  return null;
};

// ── Route handler ─────────────────────────────────────────────────────────────
export const importTrades = async (req, res) => {
  try {
    if (!getDbStatus()) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    const userId   = req.user.id;
    const { trades } = req.body;
    const accountId = req.body.account_id || null;

    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ success: false, error: 'No trades data provided' });
    }

    let imported = 0;
    const errors = [];

    for (let i = 0; i < trades.length; i++) {
      const raw = trades[i];
      try {
        const n = normalizeRow(raw);

        if (!n.symbol) throw new Error('Symbol (Pair) is required');

        if (!VALID_DIRECTIONS.has(n.direction)) {
          throw new Error(`Direction must be LONG or SHORT, got "${n.direction || '(empty)'}"`);
        }

        await query(
          `INSERT INTO trades (
            user_id, account_id, status, symbol, market_type, direction, strategy, session,
            entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit,
            position_size, pnl, rr_ratio, risk_percent,
            notes, lessons_learned, why_entered, what_happened,
            emotion_before, emotion_after,
            positive_tags, mistake_tags
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,
            $9,$10,$11,$12,$13,$14,
            $15,$16,$17,$18,
            $19,$20,$21,$22,
            $23,$24,
            $25,$26
          )`,
          [
            userId, raw.account_id || accountId, n.status, n.symbol, n.market_type, n.direction, n.strategy, n.session,
            n.entry_date, n.exit_date,
            n.entry_price, n.exit_price, n.stop_loss, n.take_profit,
            n.position_size, n.pnl, n.rr_ratio, n.risk_percent,
            n.notes, n.lessons_learned, n.why_entered, n.what_happened,
            n.emotion_before, n.emotion_after,
            JSON.stringify(n.positive_tags),
            JSON.stringify(n.mistake_tags),
          ]
        );
        imported++;
      } catch (err) {
        const sym = raw.symbol || raw.pair || raw.pairs || raw.ticker || '?';
        errors.push({ row: i + 1, error: err.message, symbol: sym });
      }
    }

    res.json({
      success: true,
      data: { total: trades.length, imported, failed: errors.length, errors: errors.slice(0, 10) },
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

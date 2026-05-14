import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
};

// ── Generic CSV/TSV parser ────────────────────────────────────────────────────

const splitLine = (line, delimiter = ',') => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values;
};

const detectDelimiter = (firstLine) => {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis) return '\t';
  if (semis > commas) return ';';
  return ',';
};

// Convert MT5 date "2026.01.15 10:30" → "2026-01-15T10:30:00"
const convertMT5Date = (s) => {
  if (!s) return '';
  return s.replace(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2}).*/, '$1-$2-$3T$4:00');
};

// ── MT5 deal history parser ───────────────────────────────────────────────────
// MT5 exports: Deal | Time | Symbol | Type(buy/sell) | Direction(in/out) | Volume | Price | S/L | T/P | Profit | ...

const parseMT5 = (lines, delimiter) => {
  const rawHeaders = splitLine(lines[0], delimiter).map(h => h.replace(/^#/, '').toLowerCase().trim());
  const idx = {};
  rawHeaders.forEach((h, i) => { idx[h] = i; });

  const get = (row, ...names) => {
    for (const n of names) {
      if (idx[n] !== undefined && row[idx[n]] !== undefined) {
        const v = row[idx[n]].trim();
        if (v) return v;
      }
    }
    return '';
  };

  const allDeals = lines.slice(1)
    .map(l => splitLine(l, delimiter))
    .filter(row => row.length > 3)
    .map(row => ({
      posId:   get(row, 'position', 'position id', 'pos id'),
      time:    convertMT5Date(get(row, 'time')),
      symbol:  get(row, 'symbol'),
      type:    get(row, 'type').toLowerCase(),       // buy / sell
      entry:   get(row, 'direction').toLowerCase(),  // in / out
      volume:  get(row, 'volume'),
      price:   get(row, 'price'),
      sl:      get(row, 's/l', 'sl', 'stop loss'),
      tp:      get(row, 't/p', 'tp', 'take profit'),
      profit:  get(row, 'profit'),
      comment: get(row, 'comment'),
    }))
    .filter(d => d.symbol && (d.entry === 'in' || d.entry === 'out'));

  const entryDeals = allDeals.filter(d => d.entry === 'in');
  const exitDeals  = allDeals.filter(d => d.entry === 'out');
  const trades = [];

  for (const ex of exitDeals) {
    // Entry deal: same symbol, same position OR opposite type
    const en = entryDeals.find(d =>
      d.symbol === ex.symbol && (d.posId === ex.posId || d.posId === '' || ex.posId === '')
    ) || entryDeals.find(d => d.symbol === ex.symbol);

    // LONG trade: entry = buy, exit = sell
    // SHORT trade: entry = sell, exit = buy
    const direction = (en ? en.type === 'buy' : ex.type === 'buy') ? 'SHORT' : 'LONG';
    // Note: exit type "sell" means closing a LONG, exit type "buy" means closing a SHORT

    trades.push({
      date:        en?.time || ex.time,
      symbol:      ex.symbol,
      direction:   (en?.type === 'buy' || (!en && ex.type === 'sell')) ? 'LONG' : 'SHORT',
      status:      'CLOSED',
      entry:       en?.price || '',
      exit:        ex.price,
      stop_loss:   en?.sl || ex.sl,
      take_profit: en?.tp || ex.tp,
      quantity:    ex.volume,
      pnl:         ex.profit,
      note:        ex.comment,
    });

    if (en) entryDeals.splice(entryDeals.indexOf(en), 1);
  }

  return trades;
};

// ── Generic CSV header-based parser ──────────────────────────────────────────

const HEADER_ALIASES = {
  date:           ['date', 'entry date', 'open date', 'trade date', 'datetime', 'time'],
  symbol:         ['symbol', 'pair', 'ticker', 'instrument', 'asset'],
  direction:      ['direction', 'side', 'type', 'trade type'],
  status:         ['status', 'state'],
  entry:          ['entry', 'entry price', 'open', 'open price', 'entry_price'],
  exit:           ['exit', 'exit price', 'close', 'close price', 'exit_price'],
  stop_loss:      ['stop loss', 'sl', 'stop', 'stoploss', 'stop_loss', 's/l'],
  take_profit:    ['take profit', 'tp', 'target', 'takeprofit', 'take_profit', 't/p'],
  quantity:       ['quantity', 'size', 'lot', 'lots', 'position size', 'volume', 'position_size'],
  risk_pct:       ['risk %', 'risk', 'risk percent', 'risk_percent', 'risk%'],
  pnl:            ['pnl', 'profit', 'p&l', 'pl', 'profit/loss', 'gain/loss', 'result'],
  rr:             ['r:r', 'rr', 'r/r', 'risk reward', 'risk/reward', 'rr_ratio'],
  strategy:       ['strategy', 'setup', 'strategy name'],
  session:        ['session', 'market session'],
  emotion_before: ['emotion before', 'emotion_before', 'psychology', 'mood before'],
  emotion_after:  ['emotion after', 'emotion_after', 'mood after'],
  why_entered:    ['reason for entry', 'why entered', 'why_entered', 'reason', 'entry reason'],
  what_happened:  ['what happened', 'what_happened', 'trade notes', 'execution notes'],
  lessons:        ['lesson learned', 'lessons learned', 'lesson', 'lessons', 'lessons_learned'],
  note:           ['note', 'notes', 'comment', 'comments', 'description'],
};

const parseGenericCSV = (lines, delimiter) => {
  const rawHeaders = splitLine(lines[0], delimiter);
  const normalized = rawHeaders.map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

  const map = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const i = normalized.findIndex(h => aliases.includes(h));
    if (i !== -1) map[field] = i;
  }

  const warnings = [];
  if (Object.keys(map).length === 0)
    warnings.push('Танигдсан header олдсонгүй — баганын нэрийг шалгана уу');

  const get = (values, field) => {
    const i = map[field];
    if (i === undefined || i >= values.length) return '';
    return values[i].trim();
  };

  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = splitLine(line, delimiter);
      if (rawHeaders.length > 1 && values.length < Math.floor(rawHeaders.length / 2)) return null;
      return {
        date:           get(values, 'date'),
        symbol:         get(values, 'symbol'),
        direction:      get(values, 'direction').toUpperCase(),
        status:         get(values, 'status').toUpperCase() || 'CLOSED',
        entry:          get(values, 'entry'),
        exit:           get(values, 'exit'),
        stop_loss:      get(values, 'stop_loss'),
        take_profit:    get(values, 'take_profit'),
        quantity:       get(values, 'quantity'),
        risk_pct:       get(values, 'risk_pct'),
        pnl:            get(values, 'pnl'),
        rr:             get(values, 'rr'),
        strategy:       get(values, 'strategy'),
        session:        get(values, 'session'),
        emotion_before: get(values, 'emotion_before'),
        emotion_after:  get(values, 'emotion_after'),
        why_entered:    get(values, 'why_entered'),
        what_happened:  get(values, 'what_happened'),
        lessons:        get(values, 'lessons'),
        note:           get(values, 'note'),
      };
    })
    .filter(r => r !== null && r.symbol !== '');

  return { rows, warnings };
};

// ── Main parse entry point ────────────────────────────────────────────────────

const parseFile = (text) => {
  const cleaned = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { rows: [], warnings: ['Хангалттай дата олдсонгүй'], isMT5: false };

  const delimiter = detectDelimiter(lines[0]);
  const firstHeaders = splitLine(lines[0], delimiter).map(h => h.replace(/^#/, '').toLowerCase().trim());

  // MT5 detection: has "direction" column AND some row has "in" or "out" as direction value
  const dirIdx = firstHeaders.indexOf('direction');
  const isMT5 = dirIdx !== -1 && lines.slice(1, 5).some(l => {
    const v = splitLine(l, delimiter)[dirIdx]?.trim().toLowerCase();
    return v === 'in' || v === 'out';
  });

  if (isMT5) {
    const rows = parseMT5(lines, delimiter);
    return { rows, warnings: rows.length === 0 ? ['MT5 format: хаагдсан арилжаа олдсонгүй'] : [], isMT5: true };
  }

  const { rows, warnings } = parseGenericCSV(lines, delimiter);
  return { rows, warnings, isMT5: false };
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [isMT5, setIsMT5] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('upload');
  const fileRef = useRef();

  if (!isOpen) return null;

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { rows, warnings: w, isMT5: mt5 } = parseFile(ev.target.result);
        if (rows.length === 0) {
          setError('Файлаас дата уншиж чадсангүй. Symbol багана байгаа эсэхийг шалгана уу.');
          return;
        }
        setPreview(rows);
        setWarnings(w);
        setIsMT5(mt5);
        setStep('preview');
      } catch (err) {
        setError('Файл уншихад алдаа гарлаа: ' + err.message);
      }
    };
    reader.readAsText(f, 'UTF-8');
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/trades/import`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ trades: preview })
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); setStep('result'); }
      else setError(data.error || 'Import failed');
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      'Date,Symbol,Direction,Status,Entry,Exit,Stop Loss,Take Profit,Quantity,Risk %,PnL,R:R,Strategy,Session,Emotion Before,Emotion After,Reason For Entry,What Happened,Lesson Learned',
      '2025-01-15,EURUSD,LONG,CLOSED,1.0850,1.0920,1.0800,1.0950,1,1.0,70,2.0,London Breakout,London,calm,confident,Price broke above key resistance,Entry was clean and followed the plan,Always wait for candle close',
      '2025-01-16,BTCUSDT,SHORT,CLOSED,43500,43200,43800,42900,0.1,1.5,150,2.0,Trend Following,New York,confident,neutral,Strong bearish momentum,Good timing on entry,Risk management was solid',
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trade_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const PREVIEW_COLS = ['symbol', 'direction', 'date', 'entry', 'exit', 'pnl'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold text-white">CSV Import</h2>
            {isMT5 && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">MetaTrader 5</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-accent/50 rounded-xl p-12 text-center cursor-pointer transition-all"
              >
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-1">CSV файлаа энд дарж сонгоно уу</p>
                <p className="text-slate-500 text-sm">Манай template болон MetaTrader 5 History export-ийг дэмждэг</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
              </div>
              <button onClick={downloadTemplate} className="flex items-center gap-2 text-accent hover:text-accent-hover text-sm mx-auto">
                <Download className="w-4 h-4" /> Жишээ template татах
              </button>
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{preview.length} арилжаа олдлоо</p>
                <p className="text-slate-400 text-sm">{file?.name}</p>
              </div>
              {warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  {warnings.map((w, i) => <p key={i} className="text-amber-400 text-xs">{w}</p>)}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {PREVIEW_COLS.map(k => <th key={k} className="text-left text-slate-400 py-2 px-3 font-medium capitalize">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        {PREVIEW_COLS.map(col => <td key={col} className="text-white py-2 px-3 max-w-[120px] truncate">{row[col] || '-'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 5 && <p className="text-slate-500 text-sm text-center">...болон {preview.length - 5} бусад</p>}
              {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4"><p className="text-rose-400 text-sm">{error}</p></div>}
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setStep('upload'); setPreview([]); setFile(null); setWarnings([]); setIsMT5(false); }} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all">Буцах</button>
                <button onClick={handleImport} disabled={isImporting} className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isImporting ? <><Loader2 className="w-5 h-5 animate-spin" /> Импортлож байна...</> : <><Upload className="w-5 h-5" /> {preview.length} арилжаа импортлох</>}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Импорт амжилттай!</h3>
                <div className="space-y-1 text-slate-300">
                  <p>Нийт: <span className="text-white font-medium">{result.total}</span></p>
                  <p>Амжилттай: <span className="text-emerald-400 font-medium">{result.imported}</span></p>
                  {result.failed > 0 && <p>Алдаатай: <span className="text-rose-400 font-medium">{result.failed}</span></p>}
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-left">
                  <p className="text-rose-400 text-sm font-medium mb-2">Алдаатай мөрүүд:</p>
                  {result.errors.map((e, i) => <p key={i} className="text-rose-300 text-xs">Мөр {e.row} ({e.symbol}): {e.error}</p>)}
                </div>
              )}
              <button onClick={() => { onImportComplete?.(); onClose(); }} className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold transition-all">Дуусгах</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  Loader2, Download, ChevronRight,
} from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ── Encoding-aware text decode (handles UTF-8 BOM + Windows-1251) ─────────────
const tryDecodeText = (buffer) => {
  let text = new TextDecoder('utf-8').decode(buffer);
  if (text.includes('�')) {
    try { text = new TextDecoder('windows-1251').decode(buffer); } catch {}
  }
  return text.replace(/^﻿/, ''); // strip BOM
};

// ── CSV utilities ─────────────────────────────────────────────────────────────
const splitLine = (line, delim = ',') => {
  const vals = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) { vals.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  vals.push(cur.trim());
  return vals;
};

const detectDelimiter = (first) => {
  const t = (first.match(/\t/g) || []).length;
  const c = (first.match(/,/g)  || []).length;
  const s = (first.match(/;/g)  || []).length;
  if (t >= c && t >= s) return '\t';
  if (s > c)            return ';';
  return ',';
};

// ── MT5 deal-history parser (unchanged logic) ─────────────────────────────────
const convertMT5Date = (s) =>
  s.replace(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2}).*/, '$1-$2-$3T$4:00');

const parseMT5 = (lines, delim) => {
  const rawH = splitLine(lines[0], delim).map(h => h.replace(/^#/, '').toLowerCase().trim());
  const idx  = {};
  rawH.forEach((h, i) => { idx[h] = i; });

  const get = (row, ...names) => {
    for (const n of names) {
      if (idx[n] !== undefined) { const v = (row[idx[n]] || '').trim(); if (v) return v; }
    }
    return '';
  };

  const allDeals = lines.slice(1)
    .map(l => splitLine(l, delim))
    .filter(r => r.length > 3)
    .map(row => ({
      posId:  get(row, 'position', 'position id'),
      time:   convertMT5Date(get(row, 'time')),
      symbol: get(row, 'symbol'),
      type:   get(row, 'type').toLowerCase(),
      entry:  get(row, 'direction').toLowerCase(),
      volume: get(row, 'volume'),
      price:  get(row, 'price'),
      sl:     get(row, 's/l', 'sl'),
      tp:     get(row, 't/p', 'tp'),
      profit: get(row, 'profit'),
      comment:get(row, 'comment'),
    }))
    .filter(d => d.symbol && (d.entry === 'in' || d.entry === 'out'));

  const entries = allDeals.filter(d => d.entry === 'in');
  const exits   = allDeals.filter(d => d.entry === 'out');
  const trades  = [];

  for (const ex of exits) {
    const en = entries.find(d => d.symbol === ex.symbol && (d.posId === ex.posId || !d.posId || !ex.posId))
             || entries.find(d => d.symbol === ex.symbol);
    trades.push({
      entry_date:   en?.time || ex.time,
      symbol:       ex.symbol,
      direction:    (en?.type === 'buy' || (!en && ex.type === 'sell')) ? 'LONG' : 'SHORT',
      status:       'CLOSED',
      entry_price:  en?.price || '',
      exit_price:   ex.price,
      stop_loss:    en?.sl || ex.sl,
      take_profit:  en?.tp || ex.tp,
      position_size: ex.volume,
      pnl:          ex.profit,
      notes:        ex.comment,
    });
    if (en) entries.splice(entries.indexOf(en), 1);
  }
  return trades;
};

// ── Generic CSV → raw rows (original headers preserved) ──────────────────────
const parseCSVRaw = (lines, delim) => {
  const headers = splitLine(lines[0], delim).map(h => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = splitLine(line, delim);
      if (vals.length < Math.max(1, Math.floor(headers.length / 2))) return null;
      const row = {};
      headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
      return row;
    })
    .filter(Boolean);
  return { headers, rows };
};

// ── Parse entry point ─────────────────────────────────────────────────────────
const parseTextFile = (text) => {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines   = cleaned.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rawRows: [], isMT5: false, warnings: ['Хангалттай дата олдсонгүй'] };

  const delim   = detectDelimiter(lines[0]);
  const firstH  = splitLine(lines[0], delim).map(h => h.replace(/^#/, '').toLowerCase().trim());

  // MT5 detection
  const dirIdx = firstH.indexOf('direction');
  const isMT5  = dirIdx !== -1 && lines.slice(1, 5).some(l => {
    const v = (splitLine(l, delim)[dirIdx] || '').trim().toLowerCase();
    return v === 'in' || v === 'out';
  });

  if (isMT5) {
    const rows = parseMT5(lines, delim);
    return { headers: [], rawRows: rows, isMT5: true, warnings: rows.length === 0 ? ['MT5: хаагдсан арилжаа олдсонгүй'] : [] };
  }

  const { headers, rows } = parseCSVRaw(lines, delim);
  return { headers, rawRows: rows, isMT5: false, warnings: [] };
};

// ── Auto-detect column mapping ────────────────────────────────────────────────
const FIELD_ALIASES = {
  symbol:          ['symbol','pair','pairs','ticker','instrument','asset','currency pair'],
  direction:       ['direction','side','type','trade type','position type','buy sell'],
  status:          ['status','state'],
  entry_date:      ['date','entry date','open date','trade date','datetime','time','open'],
  exit_date:       ['exit date','close date','close time','closed','closing date'],
  entry_price:     ['entry','entry price','open price','opening price'],
  exit_price:      ['exit','exit price','close price','closing price'],
  stop_loss:       ['stop loss','sl','stop','s/l'],
  take_profit:     ['take profit','tp','target','t/p'],
  position_size:   ['quantity','size','lot','lots','position size','volume'],
  risk_percent:    ['risk','risk percent','risk%','risk %'],
  pnl:             ['pnl','profit','p l','profit loss','profit/loss','pl','p&l','result','net profit'],
  rr_ratio:        ['r r','rr','r/r','risk reward'],
  strategy:        ['strategy','setup','model','trading model','system'],
  session:         ['session','market session','entry window','entry window new york time','entry window new york'],
  market_type:     ['market','market type','asset class'],
  emotion_before:  ['emotion before','psychology','mood before'],
  emotion_after:   ['emotion after','mood after'],
  positive_tags:   ['positive tags','positives','followed rules','what went well','strengths'],
  mistake_tags:    ['negative tags','mistakes','bad tags','what went wrong','negatives'],
  why_entered:     ['why entered','reason','entry reason','reason for entry','why'],
  what_happened:   ['what happened','trade notes','execution notes'],
  lessons_learned: ['lesson learned','lessons learned','lesson','lessons','takeaway'],
  notes:           ['note','notes','comment','comments','description','rating','rating 1 5','rating(1 5)'],
  emotion_before:  ['emotion before','psychology','mood before'],
  emotion_after:   ['emotion after','mood after'],
};

const ALIAS_MAP = Object.entries(FIELD_ALIASES).reduce((acc, [field, aliases]) => {
  aliases.forEach(a => { if (!acc[a]) acc[a] = field; });
  return acc;
}, {});

const normalizeKey = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

const detectMapping = (headers) => {
  const mapping = {};
  headers.forEach(h => { mapping[h] = ALIAS_MAP[normalizeKey(h)] || ''; });
  return mapping;
};

// ── Apply mapping → rows with system field names ──────────────────────────────
const applyMapping = (rawRows, mapping) =>
  rawRows
    .map(raw => {
      const out = {};
      Object.entries(mapping).forEach(([csvCol, sysField]) => {
        if (sysField && raw[csvCol] !== undefined) out[sysField] = raw[csvCol];
      });
      return out;
    })
    .filter(r => r.symbol);

// ── System field dropdown options ─────────────────────────────────────────────
const SYSTEM_FIELDS = [
  { value: '', label: '— Ашиглахгүй —' },
  { value: 'symbol',          label: 'Symbol / Хос' },
  { value: 'direction',       label: 'Чиглэл (LONG/SHORT)' },
  { value: 'status',          label: 'Статус' },
  { value: 'entry_date',      label: 'Оролтын огноо' },
  { value: 'exit_date',       label: 'Гаралтын огноо' },
  { value: 'entry_price',     label: 'Оролтын үнэ' },
  { value: 'exit_price',      label: 'Гаралтын үнэ' },
  { value: 'stop_loss',       label: 'Stop Loss' },
  { value: 'take_profit',     label: 'Take Profit' },
  { value: 'position_size',   label: 'Хэмжээ / Лот' },
  { value: 'risk_percent',    label: 'Эрсдэл %' },
  { value: 'pnl',             label: 'P&L (Ашиг/Алдагдал)' },
  { value: 'rr_ratio',        label: 'R/R Харьцаа' },
  { value: 'strategy',        label: 'Стратеги' },
  { value: 'session',         label: "Сешн" },
  { value: 'market_type',     label: 'Зах зээлийн төрөл' },
  { value: 'positive_tags',   label: 'Эерэг тэмдэглэл' },
  { value: 'mistake_tags',    label: 'Алдааны тэмдэглэл' },
  { value: 'why_entered',     label: 'Яагаад орсон бэ?' },
  { value: 'what_happened',   label: 'Юу болсон бэ?' },
  { value: 'lessons_learned', label: 'Юу сурсан бэ?' },
  { value: 'notes',           label: 'Тэмдэглэл' },
  { value: 'emotion_before',  label: 'Сэтгэл зүй (оролт)' },
  { value: 'emotion_after',   label: 'Сэтгэл зүй (гаралт)' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function ImportModal({ isOpen, onClose, onImportComplete, accountId = null }) {
  const [step, setStep]                 = useState('upload'); // upload | mapping | preview | result
  const [file, setFile]                 = useState(null);
  const [rawRows, setRawRows]           = useState([]);
  const [csvHeaders, setCsvHeaders]     = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [preview, setPreview]           = useState([]);
  const [warnings, setWarnings]         = useState([]);
  const [isMT5, setIsMT5]               = useState(false);
  const [isImporting, setIsImporting]   = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');
  const fileRef = useRef();

  if (!isOpen) return null;

  // ── File processing ──────────────────────────────────────────────────────────
  const processFile = async (f) => {
    setFile(f);
    setError('');
    setResult(null);
    const ext = f.name.split('.').pop().toLowerCase();

    try {
      const buffer = await f.arrayBuffer();

      if (ext === 'xlsx' || ext === 'xls') {
        // ── Excel ──────────────────────────────────────────────────────────────
        const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        if (jsonRows.length === 0) { setError('Excel файлаас дата олдсонгүй'); return; }

        const headers = Object.keys(jsonRows[0]);
        setCsvHeaders(headers);
        setRawRows(jsonRows);
        setColumnMapping(detectMapping(headers));
        setIsMT5(false);
        setStep('mapping');
      } else {
        // ── CSV / TXT ──────────────────────────────────────────────────────────
        const text = tryDecodeText(buffer);
        const { headers, rawRows: rows, isMT5: mt5, warnings: w } = parseTextFile(text);

        if (rows.length === 0) { setError('Файлаас дата олдсонгүй. Symbol багана байгаа эсэхийг шалгана уу.'); return; }

        setWarnings(w);
        setIsMT5(mt5);

        if (mt5) {
          setPreview(rows);
          setStep('preview');
        } else {
          setCsvHeaders(headers);
          setRawRows(rows);
          setColumnMapping(detectMapping(headers));
          setStep('mapping');
        }
      }
    } catch (err) {
      setError('Файл уншихад алдаа гарлаа: ' + err.message);
    }
  };

  const handleFileInput = (e) => { const f = e.target.files[0]; if (f) processFile(f); };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  // ── Apply mapping → preview ──────────────────────────────────────────────────
  const handleConfirmMapping = () => {
    const mapped = applyMapping(rawRows, columnMapping);
    if (mapped.length === 0) { setError('Symbol багана олдсонгүй. Харгалзуулалтаа шалгана уу.'); return; }
    setPreview(mapped);
    setWarnings(prev => {
      const unmapped = csvHeaders.filter(h => !columnMapping[h]);
      return unmapped.length > 0 ? [...prev, `Ашиглагдаагүй баганууд: ${unmapped.join(', ')}`] : prev;
    });
    setError('');
    setStep('preview');
  };

  // ── Import ───────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setIsImporting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/trades/import`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ trades: preview.map(t => ({ ...t, account_id: accountId })) }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); setStep('result'); }
      else setError(data.error || 'Import failed');
    } catch { setError('Сервертэй холбогдож чадсангүй'); }
    finally { setIsImporting(false); }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('upload'); setFile(null); setRawRows([]); setCsvHeaders([]);
    setColumnMapping({}); setPreview([]); setWarnings([]); setIsMT5(false);
    setError(''); setResult(null);
  };

  // ── Template download ────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv = [
      'Date,Symbol,Direction,Status,Entry,Exit,Stop Loss,Take Profit,Quantity,Risk %,PnL,R:R,Strategy,Session,Positive Tags,Negative Tags,Why Entered,What Happened,Lesson Learned',
      '2025-01-15,EURUSD,LONG,CLOSED,1.0850,1.0920,1.0800,1.0950,1,1.0,70,2.0,London Breakout,London,plan-follow,,"Price broke above key resistance","Entry clean","Always wait for close"',
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trade_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Mapping stats ─────────────────────────────────────────────────────────────
  const mappedCount = Object.values(columnMapping).filter(Boolean).length;
  const totalCols   = csvHeaders.length;

  const PREVIEW_COLS = [
    { key: 'symbol',      label: 'Symbol' },
    { key: 'direction',   label: 'Чиглэл' },
    { key: 'entry_date',  label: 'Огноо' },
    { key: 'entry_price', label: 'Оролт' },
    { key: 'exit_price',  label: 'Гаралт' },
    { key: 'pnl',         label: 'P&L' },
    { key: 'strategy',    label: 'Стратеги' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-white">
              {step === 'mapping' ? 'Баганын харгалзуулалт' : step === 'preview' ? 'Урьдчилан харах' : step === 'result' ? 'Дууслаа' : 'CSV оруулах'}
            </h2>
            {isMT5 && <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">MetaTrader 5</span>}
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {['upload','mapping','preview','result'].filter(s => !isMT5 || s !== 'mapping').map((s, i, arr) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors ${
                  s === step ? 'bg-accent text-slate-950' : arr.indexOf(s) < arr.indexOf(step) ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-600'
                }`}>{i + 1}</div>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700" />}
              </div>
            ))}
            <button onClick={onClose} className="ml-3 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-accent/50 rounded-xl p-10 text-center cursor-pointer transition-all hover:bg-slate-800/30"
              >
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">CSV эсвэл Excel файлаа сонгоно уу</p>
                <p className="text-slate-500 text-xs">.csv · .xlsx · .xls · .txt</p>
                <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
              </div>

              <button onClick={downloadTemplate}
                className="flex items-center gap-2 text-accent hover:text-accent-hover text-sm mx-auto transition-colors">
                <Download className="w-4 h-4" /> Жишээ CSV template татах
              </button>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Column Mapping ── */}
          {step === 'mapping' && (
            <div className="space-y-4">
              {/* Stats bar */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                mappedCount === totalCols
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                {mappedCount === totalCols
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>
                  {totalCols} баганаас <strong>{mappedCount}</strong> нь автоматаар тогтоогдлоо.
                  {totalCols - mappedCount > 0 && ` ${totalCols - mappedCount} харгалзуулаагүй байна.`}
                </span>
              </div>

              {/* Mapping table */}
              <div className="space-y-1.5 max-h-[42vh] overflow-y-auto custom-scrollbar pr-1">
                {/* Header row */}
                <div className="grid grid-cols-2 gap-3 px-1 mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CSV Багана</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Системийн талбар</p>
                </div>

                {csvHeaders.map(header => {
                  const mapped = columnMapping[header];
                  return (
                    <div key={header} className={`grid grid-cols-2 gap-3 items-center px-3 py-2 rounded-lg transition-colors ${
                      mapped ? 'bg-slate-800/40' : 'bg-slate-800/20'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${mapped ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <span className="text-sm text-slate-300 truncate font-medium" title={header}>{header}</span>
                      </div>
                      <select
                        value={columnMapping[header] || ''}
                        onChange={e => setColumnMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50 transition-colors"
                      >
                        {SYSTEM_FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={reset}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-all">
                  Буцах
                </button>
                <button onClick={handleConfirmMapping}
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2">
                  Урьдчилан харах <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{preview.length} арилжаа импортлоход бэлэн</p>
                <p className="text-slate-400 text-sm">{file?.name}</p>
              </div>

              {warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
                  {warnings.map((w, i) => <p key={i} className="text-amber-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{w}</p>)}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50">
                      {PREVIEW_COLS.map(c => (
                        <th key={c.key} className="text-left text-slate-400 py-2.5 px-3 font-semibold text-xs uppercase tracking-wider">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 6).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        {PREVIEW_COLS.map(c => (
                          <td key={c.key} className={`py-2.5 px-3 max-w-[140px] truncate text-xs ${
                            c.key === 'pnl'
                              ? parseFloat(row[c.key]) >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'
                              : c.key === 'direction'
                              ? row[c.key] === 'LONG' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                              : 'text-slate-300'
                          }`}>
                            {row[c.key] || <span className="text-slate-600">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.length > 6 && (
                <p className="text-slate-500 text-xs text-center">...болон {preview.length - 6} бусад арилжаа</p>
              )}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(isMT5 ? 'upload' : 'mapping')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-all">
                  Буцах
                </button>
                <button onClick={handleImport} disabled={isImporting}
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isImporting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Импортлож байна...</>
                    : <><Upload className="w-4 h-4" /> {preview.length} арилжаа импортлох</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Result ── */}
          {step === 'result' && result && (
            <div className="space-y-6 text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Импорт амжилттай!</h3>
                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  {[
                    { label: 'Нийт', value: result.total, cls: 'text-white' },
                    { label: 'Амжилттай', value: result.imported, cls: 'text-emerald-400' },
                    { label: 'Алдаатай', value: result.failed, cls: 'text-rose-400' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800 rounded-xl p-3">
                      <p className={`text-xl font-bold ${item.cls}`}>{item.value}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-rose-400 text-sm font-semibold mb-2">Алдаатай мөрүүд:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-rose-300 text-xs py-0.5">
                      Мөр {e.row} <span className="text-slate-500">({e.symbol})</span>: {e.error}
                    </p>
                  ))}
                </div>
              )}

              <button onClick={() => { onImportComplete?.(); onClose(); }}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold transition-all">
                Дуусгах
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

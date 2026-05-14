import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
};

// Maps canonical field names to possible CSV header aliases (lowercase, trimmed)
const HEADER_ALIASES = {
  date:           ['date', 'entry date', 'open date', 'trade date', 'datetime'],
  symbol:         ['symbol', 'pair', 'ticker', 'instrument', 'asset'],
  direction:      ['direction', 'side', 'type', 'trade type'],
  status:         ['status', 'state'],
  entry:          ['entry', 'entry price', 'open', 'open price', 'entry_price'],
  exit:           ['exit', 'exit price', 'close', 'close price', 'exit_price'],
  stop_loss:      ['stop loss', 'sl', 'stop', 'stoploss', 'stop_loss'],
  take_profit:    ['take profit', 'tp', 'target', 'takeprofit', 'take_profit'],
  quantity:       ['quantity', 'size', 'lot', 'lots', 'position size', 'volume', 'position_size'],
  risk_pct:       ['risk %', 'risk', 'risk percent', 'risk_percent', 'risk%'],
  pnl:            ['pnl', 'profit', 'p&l', 'pl', 'profit/loss', 'gain/loss', 'result'],
  rr:             ['r:r', 'rr', 'r/r', 'risk reward', 'risk/reward', 'rr_ratio'],
  strategy:       ['strategy', 'setup', 'strategy name'],
  session:        ['session', 'market session'],
  emotion_before: ['emotion before', 'emotion_before', 'psychology', 'mood before', 'feeling before'],
  emotion_after:  ['emotion after', 'emotion_after', 'mood after', 'feeling after'],
  why_entered:    ['reason for entry', 'why entered', 'why_entered', 'reason', 'entry reason', 'setup reason'],
  what_happened:  ['what happened', 'what_happened', 'trade notes', 'execution notes'],
  lessons:        ['lesson learned', 'lessons learned', 'lesson', 'lessons', 'lessons_learned'],
  note:           ['note', 'notes', 'comment', 'comments', 'description', 'general notes'],
};

// Build header index map: { fieldName -> columnIndex }
const buildHeaderMap = (rawHeaders) => {
  const normalized = rawHeaders.map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
  const map = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = normalized.findIndex(h => aliases.includes(h));
    if (idx !== -1) map[field] = idx;
  }
  return map;
};

// Proper CSV line splitter — preserves internal whitespace, handles quoted fields
const splitCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

const parseCSV = (text) => {
  // Remove BOM, normalize line endings
  const cleaned = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return { rows: [], warnings: ['Хангалттай дата олдсонгүй'] };

  const rawHeaders = splitCSVLine(lines[0]);
  const headerMap = buildHeaderMap(rawHeaders);

  const warnings = [];
  if (Object.keys(headerMap).length === 0) {
    warnings.push('Танигдсан header олдсонгүй — баганын нэрийг шалгана уу');
  }

  const get = (values, field) => {
    const idx = headerMap[field];
    if (idx === undefined || idx >= values.length) return '';
    return values[idx].trim();
  };

  const rows = lines.slice(1).map(line => {
    const values = splitCSVLine(line);

    // Reject rows where column count is wildly off (likely parsing error)
    if (rawHeaders.length > 1 && values.length < Math.floor(rawHeaders.length / 2)) {
      return null;
    }

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
  }).filter(row => row !== null && row.symbol !== '');

  return { rows, warnings };
};

export function ImportModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [warnings, setWarnings] = useState([]);
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
        const { rows, warnings: w } = parseCSV(ev.target.result);
        if (rows.length === 0) {
          setError('Файлаас дата уншиж чадсангүй. Symbol багана байгаа эсэхийг шалгана уу.');
          return;
        }
        setPreview(rows);
        setWarnings(w);
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
      if (data.success) {
        setResult(data.data);
        setStep('result');
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      'Date,Symbol,Direction,Status,Entry,Exit,Stop Loss,Take Profit,Quantity,Risk %,PnL,R:R,Strategy,Session,Emotion Before,Emotion After,Reason For Entry,What Happened,Lesson Learned',
      '2025-01-15,EURUSD,LONG,CLOSED,1.0850,1.0920,1.0800,1.0950,1,1.0,70,2.0,London Breakout,London,calm,confident,Price broke above key resistance,Entry was clean and followed the plan,Always wait for the candle close before entering',
      '2025-01-16,BTCUSDT,SHORT,CLOSED,43500,43200,43800,42900,0.1,1.5,150,2.0,Trend Following,New York,confident,neutral,Strong bearish momentum after rejection,Good timing on entry,Risk management was solid',
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview columns to show (first 6 meaningful ones)
  const PREVIEW_COLS = ['symbol', 'direction', 'date', 'entry', 'exit', 'pnl'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold text-white">CSV Import</h2>
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
                <p className="text-white font-medium mb-2">CSV файлаа энд дарж сонгоно уу</p>
                <p className="text-slate-400 text-sm">Header-т суурилсан автомат column тодорхойлолт</p>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
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
                  {warnings.map((w, i) => (
                    <p key={i} className="text-amber-400 text-xs">{w}</p>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {PREVIEW_COLS.map(key => (
                        <th key={key} className="text-left text-slate-400 py-2 px-3 font-medium capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        {PREVIEW_COLS.map(col => (
                          <td key={col} className="text-white py-2 px-3 max-w-[120px] truncate">{row[col] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 5 && <p className="text-slate-500 text-sm text-center">...болон {preview.length - 5} бусад арилжаа</p>}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => { setStep('upload'); setPreview([]); setFile(null); setWarnings([]); }} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all">
                  Буцах
                </button>
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
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-rose-300 text-xs">Мөр {e.row} ({e.symbol}): {e.error}</p>
                  ))}
                </div>
              )}

              <button onClick={() => { onImportComplete?.(); onClose(); }} className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold transition-all">
                Дуусгах
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

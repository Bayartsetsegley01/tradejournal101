import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
};

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_'));
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
};

export function ImportModal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({});
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
        const parsed = parseCSV(ev.target.result);
        if (parsed.length === 0) {
          setError('Файлаас дата уншиж чадсангүй');
          return;
        }
        setPreview(parsed);
        setStep('preview');
      } catch (err) {
        setError('Файл уншихад алдаа гарлаа: ' + err.message);
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/import/trades`, {
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
    const csv = 'symbol,direction,market_type,entry_date,exit_date,entry_price,exit_price,stop_loss,take_profit,position_size,pnl,strategy,notes\nEURUSD,LONG,forex,2025-01-15 10:30,2025-01-15 14:00,1.0850,1.0920,1.0820,1.0950,1.0,70,Breakout,Good setup\nBTCUSDT,SHORT,crypto,2025-01-16 09:00,2025-01-16 12:00,43500,43200,43800,43000,0.5,150,Trend Following,Followed plan';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_template.csv';
    a.click();
  };

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
                <p className="text-slate-400 text-sm">Дэмждэг формат: .csv</p>
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

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {Object.keys(preview[0] || {}).slice(0, 6).map(key => (
                        <th key={key} className="text-left text-slate-400 py-2 px-3 font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        {Object.values(row).slice(0, 6).map((val, j) => (
                          <td key={j} className="text-white py-2 px-3">{val}</td>
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
                <button onClick={() => { setStep('upload'); setPreview([]); setFile(null); }} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all">
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

import { useState } from "react";
import { X, FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// helpers

const cleanText = (val) => {
  if (val === null || val === undefined) return '-';
  const s = String(val)
    .replace(/\x00/g, '')
    .replace(/\r?\n|\r/g, ' ')
    .normalize('NFC')
    .trim();
  return s || '-';
};

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '-'; }
};

// CSV-д comma-гүй ISO формат ашиглана (Jan 15, 2026 → comma → column split болдог)
const fmtDateCSV = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
};

const fmtPnl = (n) => {
  const v = parseFloat(n ?? 0);
  if (isNaN(v)) return '-';
  return `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;
};

const fmtNum = (n) => {
  const v = parseFloat(n);
  return isNaN(v) ? '-' : String(v);
};

// options

const DEFAULT_OPTIONS = {
  tradeInfo:       true,
  entryExit:       true,
  riskManagement:  true,
  pnlStats:        true,
  strategySession: true,
  psychology:      true,
  reasonForEntry:  true,
  whatHappened:    true,
  lessonLearned:   true,
  screenshots:     false,
};

const OPTION_LABELS = {
  tradeInfo:       'Trade Information',
  entryExit:       'Entry / Exit / SL / TP',
  riskManagement:  'Quantity & Risk %',
  pnlStats:        'PnL Statistics',
  strategySession: 'Strategy & Session',
  psychology:      'Emotion / Psychology',
  reasonForEntry:  'Reason For Entry',
  whatHappened:    'What Happened',
  lessonLearned:   'Lesson Learned',
  screenshots:     'Screenshots (PDF only)',
};

// PDF HTML builder

function buildReportHTML({ trades, options, stats }) {
  const pnlColor = (n) => parseFloat(n ?? 0) >= 0 ? '#16a34a' : '#dc2626';

  const coverHTML = `
    <div style="min-height:1050px;display:flex;flex-direction:column;justify-content:center;padding:60px 56px;background:white;border-bottom:3px solid #f1f5f9;margin-bottom:56px;">
      <div style="background:#f8fafc;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:28px;width:fit-content;">
        <span style="font-size:11px;font-weight:700;letter-spacing:2px;color:#64748b;text-transform:uppercase;">Trade Journal</span>
      </div>
      <h1 style="font-size:44px;font-weight:800;color:#0f172a;margin:0 0 10px;line-height:1.1;">Trading Performance<br/>Report</h1>
      <p style="font-size:15px;color:#94a3b8;margin:0 0 48px;">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; ${stats.total} trades</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:100%;">
        <div style="background:#f8fafc;border-radius:14px;padding:22px 20px;">
          <p style="font-size:10px;color:#94a3b8;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Net PnL</p>
          <p style="font-size:28px;font-weight:800;margin:0;color:${pnlColor(stats.netPnl)};">${fmtPnl(stats.netPnl)}</p>
        </div>
        <div style="background:#f8fafc;border-radius:14px;padding:22px 20px;">
          <p style="font-size:10px;color:#94a3b8;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Win Rate</p>
          <p style="font-size:28px;font-weight:800;margin:0;color:#0f172a;">${stats.winRate}%</p>
        </div>
        <div style="background:#f8fafc;border-radius:14px;padding:22px 20px;">
          <p style="font-size:10px;color:#94a3b8;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Closed Trades</p>
          <p style="font-size:28px;font-weight:800;margin:0;color:#0f172a;">${stats.closed} / ${stats.total}</p>
        </div>
        ${stats.bestTrade ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:22px 20px;">
          <p style="font-size:10px;color:#16a34a;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Best Trade</p>
          <p style="font-size:22px;font-weight:800;margin:0;color:#15803d;">${fmtPnl(stats.bestTrade.pnl)}</p>
          <p style="font-size:11px;color:#16a34a;margin:5px 0 0;">${cleanText(stats.bestTrade.symbol)} &middot; ${cleanText(stats.bestTrade.direction)}</p>
        </div>` : ''}
        ${stats.worstTrade ? `
        <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:14px;padding:22px 20px;">
          <p style="font-size:10px;color:#dc2626;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Worst Trade</p>
          <p style="font-size:22px;font-weight:800;margin:0;color:#b91c1c;">${fmtPnl(stats.worstTrade.pnl)}</p>
          <p style="font-size:11px;color:#dc2626;margin:5px 0 0;">${cleanText(stats.worstTrade.symbol)} &middot; ${cleanText(stats.worstTrade.direction)}</p>
        </div>` : ''}
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:14px;padding:22px 20px;">
          <p style="font-size:10px;color:#7c3aed;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Avg RR</p>
          <p style="font-size:22px;font-weight:800;margin:0;color:#6d28d9;">${stats.avgRR}R</p>
        </div>
      </div>
    </div>
  `;

  const tradeCardsHTML = trades.map((t, i) => {
    const pnlVal = parseFloat(t.pnl ?? 0);
    const isWin = pnlVal > 0;
    const isLoss = pnlVal < 0;
    const dirLong = cleanText(t.direction) === 'LONG';

    const headerBg = isWin ? '#f0fdf4' : isLoss ? '#fff1f2' : '#f8fafc';
    const headerBdr = isWin ? '#bbf7d0' : isLoss ? '#fecdd3' : '#e2e8f0';
    const pnlClr = isWin ? '#16a34a' : isLoss ? '#dc2626' : '#64748b';

    const priceRow = (options.entryExit || options.riskManagement) ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #f1f5f9;">
        ${options.entryExit ? `
        <div style="padding:14px 18px;border-right:1px solid #f1f5f9;">
          <p style="font-size:9px;color:#94a3b8;margin:0 0 3px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Entry</p>
          <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0;font-family:monospace;">${cleanText(t.entry_price ?? t.entry)}</p>
        </div>
        <div style="padding:14px 18px;border-right:1px solid #f1f5f9;">
          <p style="font-size:9px;color:#94a3b8;margin:0 0 3px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Exit</p>
          <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0;font-family:monospace;">${cleanText(t.exit_price ?? t.exit)}</p>
        </div>
        <div style="padding:14px 18px;border-right:1px solid #f1f5f9;">
          <p style="font-size:9px;color:#dc2626;margin:0 0 3px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Stop Loss</p>
          <p style="font-size:13px;font-weight:700;color:#dc2626;margin:0;font-family:monospace;">${cleanText(t.stop_loss ?? t.stopLoss)}</p>
        </div>
        <div style="padding:14px 18px;">
          <p style="font-size:9px;color:#16a34a;margin:0 0 3px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Take Profit</p>
          <p style="font-size:13px;font-weight:700;color:#16a34a;margin:0;font-family:monospace;">${cleanText(t.take_profit ?? t.takeProfit)}</p>
        </div>` : ''}
        ${options.riskManagement ? `
        <div style="padding:14px 18px;border-right:1px solid #f1f5f9;${options.entryExit ? 'grid-column:1/3;border-top:1px solid #f1f5f9;' : ''}">
          <p style="font-size:9px;color:#94a3b8;margin:0 0 3px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Quantity</p>
          <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0;font-family:monospace;">${cleanText(t.position_size ?? t.quantity)}</p>
        </div>
        <div style="padding:14px 18px;${options.entryExit ? 'grid-column:3/5;border-top:1px solid #f1f5f9;' : ''}">
          <p style="font-size:9px;color:#94a3b8;margin:0 0 3px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Risk %</p>
          <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0;font-family:monospace;">${cleanText(t.risk_percent ?? t.riskPercent)}${(t.risk_percent ?? t.riskPercent) !== null && (t.risk_percent ?? t.riskPercent) !== undefined && cleanText(t.risk_percent ?? t.riskPercent) !== '-' ? '%' : ''}</p>
        </div>` : ''}
      </div>` : '';

    const strategyRow = options.strategySession && (t.strategy || t.session || t.market_type) ? `
      <div style="display:flex;gap:24px;padding:14px 18px;border-bottom:1px solid #f1f5f9;background:#fafafa;">
        ${t.strategy ? `<div><p style="font-size:9px;color:#94a3b8;margin:0 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Strategy</p><p style="font-size:12px;font-weight:600;color:#0f172a;margin:0;">${cleanText(t.strategy)}</p></div>` : ''}
        ${t.session ? `<div><p style="font-size:9px;color:#94a3b8;margin:0 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Session</p><p style="font-size:12px;font-weight:600;color:#0f172a;margin:0;">${cleanText(t.session)}</p></div>` : ''}
        ${t.market_type ? `<div><p style="font-size:9px;color:#94a3b8;margin:0 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Market</p><p style="font-size:12px;font-weight:600;color:#0f172a;margin:0;">${cleanText(t.market_type)}</p></div>` : ''}
      </div>` : '';

    const psychRow = options.psychology && (t.emotionBefore || t.emotion_before || t.emotionAfter || t.emotion_after) ? `
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;background:#fafafa;">
        <p style="font-size:9px;color:#94a3b8;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Psychology</p>
        <div style="display:flex;gap:16px;">
          ${(t.emotionBefore || t.emotion_before) ? `<span style="font-size:12px;color:#475569;">Before: <strong style="color:#0f172a;">${cleanText(t.emotionBefore || t.emotion_before)}</strong></span>` : ''}
          ${(t.emotionAfter || t.emotion_after) ? `<span style="font-size:12px;color:#475569;">After: <strong style="color:#0f172a;">${cleanText(t.emotionAfter || t.emotion_after)}</strong></span>` : ''}
        </div>
      </div>` : '';

    const note = (label, text, accent = '#475569') => {
      const v = cleanText(text);
      if (v === '-') return '';
      return `<div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:9px;color:${accent};margin:0 0 5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
        <p style="font-size:12px;color:#334155;margin:0;line-height:1.6;">${v}</p>
      </div>`;
    };

    const notesSection = [
      options.reasonForEntry ? note('Reason For Entry', t.whyEntered || t.why_entered, '#6d28d9') : '',
      options.whatHappened  ? note('What Happened',    t.whatHappened || t.what_happened) : '',
      options.lessonLearned ? note('Lesson Learned',   t.lessonLearned || t.lessons_learned, '#0369a1') : '',
    ].join('');

    const screenshotURL = t.screenshot_url;
    const screenshotSection = options.screenshots && screenshotURL ? `
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
        <p style="font-size:9px;color:#94a3b8;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Screenshot</p>
        <img src="${screenshotURL}" crossorigin="anonymous" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;display:block;" />
      </div>` : '';

    return `
      <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;margin:0 48px 28px;">
        <div style="background:${headerBg};border-bottom:1px solid ${headerBdr};padding:16px 18px;display:flex;align-items:flex-start;justify-content:space-between;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
              <span style="font-size:10px;color:#94a3b8;font-weight:600;">#${i + 1}</span>
              <span style="font-size:19px;font-weight:800;color:#0f172a;">${cleanText(t.symbol)}</span>
              <span style="background:${dirLong ? '#dcfce7' : '#fee2e2'};color:${dirLong ? '#16a34a' : '#dc2626'};font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;">${cleanText(t.direction)}</span>
              <span style="background:#f1f5f9;color:#64748b;font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;">${cleanText(t.status)}</span>
            </div>
            <span style="font-size:11px;color:#94a3b8;">${fmtDate(t.entry_date || t.date)}</span>
          </div>
          ${options.pnlStats ? `<div style="text-align:right;">
            <p style="font-size:22px;font-weight:800;color:${pnlClr};margin:0;">${fmtPnl(t.pnl)}</p>
            ${(t.rr_ratio ?? t.rrRatio) ? `<p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">${parseFloat(t.rr_ratio ?? t.rrRatio ?? 0).toFixed(1)}R</p>` : ''}
          </div>` : ''}
        </div>
        ${priceRow}
        ${strategyRow}
        ${psychRow}
        ${notesSection}
        ${screenshotSection}
      </div>
    `;
  }).join('');

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:white;width:800px;color:#1e293b;">${coverHTML}${tradeCardsHTML}<div style="padding:40px 48px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #f1f5f9;margin-top:40px;">Generated by Trade Journal &middot; ${new Date().toISOString().slice(0, 10)}</div></div>`;
}

// component

export function ExportModal({ onClose, trades = [] }) {
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);

  const toggle = (key) => setOptions(o => ({ ...o, [key]: !o[key] }));
  const allOn = Object.values(options).every(Boolean);
  const toggleAll = () => {
    const v = !allOn;
    setOptions(Object.fromEntries(Object.keys(DEFAULT_OPTIONS).map(k => [k, v])));
  };

  // CSV
  const handleExportCSV = () => {
    if (!trades.length) return alert('Татах арилжаа байхгүй байна.');

    const cols = [];
    if (options.tradeInfo)       cols.push(['Date', t => fmtDateCSV(t.entry_date || t.date)], ['Symbol', t => cleanText(t.symbol)], ['Direction', t => cleanText(t.direction)], ['Status', t => cleanText(t.status)]);
    if (options.entryExit)       cols.push(['Entry', t => fmtNum(t.entry_price ?? t.entry)], ['Exit', t => fmtNum(t.exit_price ?? t.exit)], ['Stop Loss', t => fmtNum(t.stop_loss ?? t.stopLoss)], ['Take Profit', t => fmtNum(t.take_profit ?? t.takeProfit)]);
    if (options.riskManagement)  cols.push(['Quantity', t => fmtNum(t.position_size ?? t.quantity)], ['Risk %', t => fmtNum(t.risk_percent ?? t.riskPercent)]);
    if (options.pnlStats)        cols.push(['PnL', t => parseFloat(t.pnl ?? 0).toFixed(2)], ['R:R', t => fmtNum(t.rr_ratio ?? t.rrRatio)]);
    if (options.strategySession) cols.push(['Strategy', t => cleanText(t.strategy)], ['Session', t => cleanText(t.session)]);
    if (options.psychology)      cols.push(['Emotion Before', t => cleanText(t.emotionBefore || t.emotion_before)], ['Emotion After', t => cleanText(t.emotionAfter || t.emotion_after)]);
    if (options.reasonForEntry)  cols.push(['Reason For Entry', t => `"${cleanText(t.whyEntered || t.why_entered).replace(/"/g, '""')}"`]);
    if (options.whatHappened)    cols.push(['What Happened',    t => `"${cleanText(t.whatHappened || t.what_happened).replace(/"/g, '""')}"`]);
    if (options.lessonLearned)   cols.push(['Lesson Learned',   t => `"${cleanText(t.lessonLearned || t.lessons_learned).replace(/"/g, '""')}"`]);

    const header = cols.map(([h]) => h).join(',');
    const rows = trades.map(t => cols.map(([, fn]) => fn(t)).join(','));
    const BOM = '﻿';
    const csv = BOM + [header, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade_journal_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  // PDF
  const handleExportPDF = async () => {
    if (!trades.length) return alert('Татах арилжаа байхгүй байна.');
    setIsExporting(true);

    try {
      const closed = trades.filter(t => t.status === 'CLOSED');
      const wins = closed.filter(t => parseFloat(t.pnl ?? 0) > 0);
      const netPnl = closed.reduce((s, t) => s + parseFloat(t.pnl ?? 0), 0);
      const winRate = closed.length ? ((wins.length / closed.length) * 100).toFixed(1) : 0;
      const rrValues = trades.map(t => parseFloat(t.rr_ratio ?? t.rrRatio ?? 0)).filter(v => v > 0);
      const avgRR = rrValues.length ? (rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(2) : '-';
      const bestTrade = closed.length ? closed.reduce((b, t) => parseFloat(t.pnl ?? 0) > parseFloat(b.pnl ?? 0) ? t : b) : null;
      const worstTrade = closed.length ? closed.reduce((w, t) => parseFloat(t.pnl ?? 0) < parseFloat(w.pnl ?? 0) ? t : w) : null;

      const reportHTML = buildReportHTML({
        trades,
        options,
        stats: { netPnl, winRate, total: trades.length, closed: closed.length, avgRR, bestTrade, worstTrade },
      });

      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:800px;';
      wrap.innerHTML = reportHTML;
      document.body.appendChild(wrap);

      const canvas = await html2canvas(wrap.firstChild, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 8000,
      });

      document.body.removeChild(wrap);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const pxPerPage = Math.floor(canvas.width * (pageH / pageW));

      let offsetPx = 0;
      let pageNum = 0;

      while (offsetPx < canvas.height) {
        if (pageNum > 0) doc.addPage();

        const sliceH = Math.min(pxPerPage, canvas.height - offsetPx);
        const sc = document.createElement('canvas');
        sc.width = canvas.width;
        sc.height = sliceH;
        sc.getContext('2d').drawImage(canvas, 0, -offsetPx);

        const imgData = sc.toDataURL('image/jpeg', 0.93);
        const renderedH = (sliceH / canvas.width) * pageW;
        doc.addImage(imgData, 'JPEG', 0, 0, pageW, renderedH);

        offsetPx += pxPerPage;
        pageNum++;
      }

      doc.save(`trade_journal_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      onClose();
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('PDF үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = format === 'csv' ? handleExportCSV : handleExportPDF;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Trade Journal Report Generator</h2>
            <p className="text-xs text-slate-400 mt-0.5">{trades.length} арилжаа · Форматаа сонгоод татаж авна уу</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Format toggle */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Формат</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${format === 'pdf' ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <FileText className="w-4 h-4" /> PDF Report
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${format === 'csv' ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV Data
              </button>
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Оруулах мэдээлэл</p>
              <button onClick={toggleAll} className="text-[11px] text-accent hover:underline">
                {allOn ? 'Бүгдийг арилгах' : 'Бүгдийг сонгох'}
              </button>
            </div>
            <div className="space-y-1">
              {Object.entries(OPTION_LABELS).map(([key, label]) => {
                const isPdfOnly = key === 'screenshots';
                const disabled = isPdfOnly && format === 'csv';
                const checked = options[key] && !disabled;
                return (
                  <label
                    key={key}
                    onClick={() => !disabled && toggle(key)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-accent border-accent' : 'border-slate-600'}`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-slate-950" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-slate-300 flex-1">{label}</span>
                    {isPdfOnly && <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">PDF</span>}
                  </label>
                );
              })}
            </div>
          </div>

          {format === 'csv' && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-500 leading-relaxed">
              CSV нь Excel болон Google Sheets-д нийцсэн формат. Бүх текст хязгааргүй оригиналаараа хадгалагдана.
            </div>
          )}

          {format === 'pdf' && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-500 leading-relaxed">
              PDF нь браузерийн фонтыг ашиглан render хийгддэг тул Монгол текст зөв гарна. Screenshots-тай бол файлын хэмжээ томрох тул анхаарна уу.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Цуцлах
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || trades.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm py-2.5 px-4 rounded-xl transition-all"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Үүсгэж байна...</>
            ) : (
              <><Download className="w-4 h-4" /> {format === 'pdf' ? 'PDF татах' : 'CSV татах'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

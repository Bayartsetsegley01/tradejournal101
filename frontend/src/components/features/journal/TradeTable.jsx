import { useState, useRef, useEffect } from "react";
import {
  Image, FileText, ArrowUpRight, ArrowDownRight,
  Bitcoin, DollarSign, LineChart, Coins, Box, Activity, Clock, Layers,
  MoreHorizontal, Edit2, Copy, Trash2, Pencil, CheckCircle2, XCircle,
} from "lucide-react";
import { EMOTIONS, MARKET_TYPES } from "@/lib/constants";
import { safeFormatDate } from "@/lib/utils";

const MARKET_CONFIG = {
  crypto:      { icon: Bitcoin,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  forex:       { icon: DollarSign,color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
  stock:       { icon: LineChart, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  gold:        { icon: Coins,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  commodities: { icon: Box,       color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  indices:     { icon: Activity,  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  futures:     { icon: Clock,     color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  options:     { icon: Layers,    color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
};

const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const NUM_INPUT = "w-24 bg-slate-950 border border-accent/60 rounded-lg px-2 py-1.5 text-right text-white text-sm outline-none focus:ring-1 focus:ring-accent/30 font-mono";

const NOTE_FIELDS = [
  { key: 'why_entered',    label: 'Яагаад орсон бэ?',  placeholder: 'Setup, дохио, шалтгаан...' },
  { key: 'what_happened',  label: 'Юу болсон бэ?',     placeholder: 'Арилжааны явц, зах зээлийн хөдөлгөөн...' },
  { key: 'lessons_learned',label: 'Юу сурсан бэ?',     placeholder: 'Дараагийн удаа анхаарах зүйл...' },
];

export function TradeTable({ trades, onRowClick, onEdit, onDuplicate, onDelete, onPatch }) {
  const [editingCell, setEditingCell] = useState(null);
  const [vals, setVals] = useState({});
  const [flashes, setFlashes] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);

  // Accordion state
  const [expandedId, setExpandedId] = useState(null);
  const [noteVals, setNoteVals] = useState({});
  const [noteSaved, setNoteSaved] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { setEditingCell(null); setExpandedId(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggleExpand = (trade) => {
    if (editingCell) return;
    const opening = expandedId !== trade.id;
    setExpandedId(opening ? trade.id : null);
    if (opening) {
      setNoteVals(prev => ({
        ...prev,
        [trade.id]: {
          why_entered: trade.why_entered || '',
          what_happened: trade.what_happened || '',
          lessons_learned: trade.lessons_learned || '',
        },
      }));
    }
  };

  const saveNotes = async (id) => {
    try {
      await onPatch(id, noteVals[id] || {});
      setNoteSaved(id);
      setTimeout(() => setNoteSaved(n => n === id ? null : n), 1500);
    } catch {}
  };

  // ── Inline cell edit helpers ─────────────────────────────────────────────────

  const startEdit = (e, id, field, initVal) => {
    e.stopPropagation();
    setEditingCell({ id, field });
    if (field === 'market_symbol') {
      setVals(v => ({ ...v, [`${id}:market`]: initVal.market, [`${id}:symbol`]: initVal.symbol }));
    } else {
      setVals(v => ({ ...v, [`${id}:${field}`]: initVal }));
    }
  };

  const gv = (id, field) => vals[`${id}:${field}`];
  const sv = (id, field, v) => setVals(p => ({ ...p, [`${id}:${field}`]: v }));
  const isEdit = (id, field) => editingCell?.id === id && editingCell?.field === field;

  const flash = (id, field) => flashes[`${id}:${field}`];
  const setFlash = (id, field, type) => {
    const key = `${id}:${field}`;
    setFlashes(f => ({ ...f, [key]: type }));
    setTimeout(() => setFlashes(f => { const n = { ...f }; delete n[key]; return n; }), type === 'ok' ? 800 : 1500);
  };

  const saveField = async (id, field, changes) => {
    setEditingCell(null);
    try {
      await onPatch(id, changes);
      setFlash(id, field, 'ok');
    } catch {
      setFlash(id, field, 'err');
    }
  };

  const FlashOverlay = ({ id, field }) => {
    const f = flash(id, field);
    return (
      <>
        {f === 'ok' && <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-emerald-400 pointer-events-none" />}
        {f === 'err' && <XCircle className="absolute top-1 right-1 w-3 h-3 text-rose-400 pointer-events-none" />}
        {!f && <Pencil className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-700 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none" />}
      </>
    );
  };

  const cellCls = (id, field, extra = '') => {
    const f = flash(id, field);
    const editing = isEdit(id, field);
    return [
      'px-5 py-4 relative group/cell cursor-pointer transition-colors select-none',
      editing ? 'bg-accent/5' : 'hover:bg-slate-800/20',
      f === 'ok' ? '!bg-emerald-500/10' : f === 'err' ? '!bg-rose-500/10' : '',
      extra,
    ].filter(Boolean).join(' ');
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <FileText className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-base font-medium">Арилжаа байхгүй байна</p>
        <p className="text-sm mt-1">Шинэ арилжаа нэмж эхлээрэй</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-left text-sm text-slate-400 border-collapse">
        <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-900/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
          <tr>
            <th className="px-5 py-4 font-semibold border-b border-slate-800">Огноо</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800">Market & Symbol</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800">L/S</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">Entry</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">Exit</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">R/R</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">P&L</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-center">Status</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-center">Сэтгэл зүй</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-center">Media</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const isWin = t.pnl > 0;
            const isLoss = t.pnl < 0;
            const market = (t.market || t.market_type || 'forex').toLowerCase();
            const mConf = MARKET_CONFIG[market] || MARKET_CONFIG.forex;
            const MIcon = mConf.icon;
            const emotBefore = t.emotionBefore || t.emotion_before || '';
            const emotAfter  = t.emotionAfter  || t.emotion_after  || '';
            const isExpanded = expandedId === t.id;
            const nv = noteVals[t.id] || {};

            return (
              <>
                {/* ── Main data row ─────────────────────────────────────────── */}
                <tr
                  key={t.id}
                  onClick={() => toggleExpand(t)}
                  className={`border-b border-slate-800/50 transition-all ${editingCell ? 'cursor-default' : 'cursor-pointer'} group ${isExpanded ? 'bg-slate-800/20' : 'hover:bg-slate-800/30'}`}
                >

                  {/* ── DATE ──────────────────────── */}
                  <td className={cellCls(t.id, 'entry_date')} onClick={(e) => startEdit(e, t.id, 'entry_date', toDatetimeLocal(t.entry_date || t.date))}>
                    {isEdit(t.id, 'entry_date') ? (
                      <input
                        type="datetime-local" autoFocus
                        defaultValue={gv(t.id, 'entry_date')}
                        onChange={(e) => sv(t.id, 'entry_date', e.target.value)}
                        onBlur={(e) => saveField(t.id, 'entry_date', { entry_date: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveField(t.id, 'entry_date', { entry_date: gv(t.id, 'entry_date') });
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-950 border border-accent/60 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:ring-1 focus:ring-accent/30 w-44"
                      />
                    ) : (
                      <>
                        <div className="text-slate-300 font-medium text-sm">{safeFormatDate(t.entry_date || t.date, "MMM dd, HH:mm")}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{safeFormatDate(t.entry_date || t.date, "EEEE")}</div>
                        <FlashOverlay id={t.id} field="entry_date" />
                      </>
                    )}
                  </td>

                  {/* ── MARKET & SYMBOL ───────────── */}
                  <td className={cellCls(t.id, 'market_symbol')} onClick={(e) => startEdit(e, t.id, 'market_symbol', { market, symbol: t.symbol || '' })}>
                    {isEdit(t.id, 'market_symbol') ? (
                      <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={gv(t.id, 'market') ?? market}
                          onChange={(e) => sv(t.id, 'market', e.target.value)}
                          className="bg-slate-950 border border-accent/60 rounded-lg px-2 py-1 text-white text-xs outline-none w-32"
                        >
                          {MARKET_TYPES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                        <input
                          type="text" autoFocus placeholder="EURUSD"
                          value={gv(t.id, 'symbol') ?? t.symbol ?? ''}
                          onChange={(e) => sv(t.id, 'symbol', e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveField(t.id, 'market_symbol', { market_type: gv(t.id, 'market'), symbol: gv(t.id, 'symbol') });
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="bg-slate-950 border border-accent/60 rounded-lg px-2 py-1 text-white text-xs outline-none w-32 uppercase font-mono focus:ring-1 focus:ring-accent/30"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${mConf.bg} ${mConf.border} ${mConf.color}`}>
                            <MIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white tracking-wide text-sm">{t.symbol}</div>
                            <div className="text-[11px] text-slate-500 uppercase tracking-wider">{t.market_type || market}</div>
                          </div>
                        </div>
                        <FlashOverlay id={t.id} field="market_symbol" />
                      </>
                    )}
                  </td>

                  {/* ── DIRECTION ────────────────── */}
                  <td className={cellCls(t.id, 'direction')} onClick={(e) => startEdit(e, t.id, 'direction', t.direction)}>
                    {isEdit(t.id, 'direction') ? (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {['LONG', 'SHORT'].map((d) => (
                          <button key={d} onClick={() => saveField(t.id, 'direction', { direction: d })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${d === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'} ${t.direction === d ? 'ring-2 ring-current' : ''}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {t.direction === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {t.direction}
                        </div>
                        <FlashOverlay id={t.id} field="direction" />
                      </>
                    )}
                  </td>

                  {/* ── ENTRY ────────────────────── */}
                  <td className={cellCls(t.id, 'entry_price', 'text-right')} onClick={(e) => startEdit(e, t.id, 'entry_price', t.entry_price ?? t.entry ?? '')}>
                    {isEdit(t.id, 'entry_price') ? (
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <input type="number" step="any" autoFocus
                          value={gv(t.id, 'entry_price') ?? ''}
                          onChange={(e) => sv(t.id, 'entry_price', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveField(t.id, 'entry_price', { entry_price: parseFloat(gv(t.id, 'entry_price')) || null }); if (e.key === 'Escape') setEditingCell(null); }}
                          onBlur={() => saveField(t.id, 'entry_price', { entry_price: parseFloat(gv(t.id, 'entry_price')) || null })}
                          className={NUM_INPUT} />
                      </div>
                    ) : (
                      <>
                        <span className="font-mono text-slate-300">{t.entry_price ?? t.entry ?? <span className="text-slate-600">—</span>}</span>
                        <FlashOverlay id={t.id} field="entry_price" />
                      </>
                    )}
                  </td>

                  {/* ── EXIT ─────────────────────── */}
                  <td className={cellCls(t.id, 'exit_price', 'text-right')} onClick={(e) => startEdit(e, t.id, 'exit_price', t.exit_price ?? t.exit ?? '')}>
                    {isEdit(t.id, 'exit_price') ? (
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <input type="number" step="any" autoFocus
                          value={gv(t.id, 'exit_price') ?? ''}
                          onChange={(e) => sv(t.id, 'exit_price', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveField(t.id, 'exit_price', { exit_price: parseFloat(gv(t.id, 'exit_price')) || null }); if (e.key === 'Escape') setEditingCell(null); }}
                          onBlur={() => saveField(t.id, 'exit_price', { exit_price: parseFloat(gv(t.id, 'exit_price')) || null })}
                          className={NUM_INPUT} />
                      </div>
                    ) : (
                      <>
                        <span className="font-mono text-slate-300">{t.exit_price ?? t.exit ?? <span className="text-slate-600">—</span>}</span>
                        <FlashOverlay id={t.id} field="exit_price" />
                      </>
                    )}
                  </td>

                  {/* ── R/R ──────────────────────── */}
                  <td className={cellCls(t.id, 'rr_ratio', 'text-right')} onClick={(e) => startEdit(e, t.id, 'rr_ratio', t.rr_ratio ?? t.rr ?? '')}>
                    {isEdit(t.id, 'rr_ratio') ? (
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <input type="number" step="0.1" min="0" autoFocus
                          value={gv(t.id, 'rr_ratio') ?? ''}
                          onChange={(e) => sv(t.id, 'rr_ratio', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveField(t.id, 'rr_ratio', { rr_ratio: parseFloat(gv(t.id, 'rr_ratio')) || null }); if (e.key === 'Escape') setEditingCell(null); }}
                          onBlur={() => saveField(t.id, 'rr_ratio', { rr_ratio: parseFloat(gv(t.id, 'rr_ratio')) || null })}
                          className={NUM_INPUT} />
                      </div>
                    ) : (
                      <>
                        {(t.rr_ratio ?? t.rr) ? (
                          <span className={`px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono ${(t.rr_ratio ?? t.rr) >= 2 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {t.rr_ratio ?? t.rr}R
                          </span>
                        ) : <span className="text-slate-600 font-mono">—</span>}
                        <FlashOverlay id={t.id} field="rr_ratio" />
                      </>
                    )}
                  </td>

                  {/* ── P&L ──────────────────────── */}
                  <td className={cellCls(t.id, 'pnl', 'text-right')} onClick={(e) => startEdit(e, t.id, 'pnl', t.pnl ?? '')}>
                    {isEdit(t.id, 'pnl') ? (
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <input type="number" step="any" autoFocus
                          value={gv(t.id, 'pnl') ?? ''}
                          onChange={(e) => sv(t.id, 'pnl', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveField(t.id, 'pnl', { pnl: parseFloat(gv(t.id, 'pnl')) }); if (e.key === 'Escape') setEditingCell(null); }}
                          onBlur={() => saveField(t.id, 'pnl', { pnl: parseFloat(gv(t.id, 'pnl')) })}
                          className={NUM_INPUT} />
                      </div>
                    ) : (
                      <>
                        {t.pnl != null ? (
                          <span className={`font-mono font-bold text-base ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}`}>
                            {t.pnl > 0 ? '+' : ''}${t.pnl}
                          </span>
                        ) : <span className="text-slate-600 font-mono">—</span>}
                        <FlashOverlay id={t.id} field="pnl" />
                      </>
                    )}
                  </td>

                  {/* ── STATUS ───────────────────── */}
                  <td className={cellCls(t.id, 'status', 'text-center')} onClick={(e) => startEdit(e, t.id, 'status', t.status)}>
                    {isEdit(t.id, 'status') ? (
                      <div className="flex flex-col gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                        {['OPEN', 'CLOSED', 'CANCELLED'].map((s) => (
                          <button key={s} onClick={() => saveField(t.id, 'status', { status: s })}
                            className={`w-24 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                              s === 'OPEN'      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' :
                              s === 'CLOSED'    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' :
                                                 'bg-slate-800/30 text-slate-500 border-slate-700/50 hover:bg-slate-700/50'
                            } ${t.status === s ? 'ring-1 ring-current' : ''}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border ${
                          t.status === 'OPEN'      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          t.status === 'CANCELLED' ? 'bg-slate-800/30 text-slate-600 border-slate-700/30' :
                                                     'bg-slate-800/50 text-slate-400 border-slate-700/50'
                        }`}>
                          {t.status}
                        </span>
                        <FlashOverlay id={t.id} field="status" />
                      </>
                    )}
                  </td>

                  {/* ── EMOTION ──────────────────── */}
                  <td className={cellCls(t.id, 'emotion', 'text-center')} onClick={(e) => startEdit(e, t.id, 'emotion', { before: emotBefore, after: emotAfter })}>
                    {isEdit(t.id, 'emotion') ? (
                      <div className="min-w-[190px] text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-2">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Оролтоос өмнө</div>
                          <div className="flex flex-wrap gap-0.5">
                            {EMOTIONS.map((em) => (
                              <button key={em.id} title={em.label}
                                onClick={() => saveField(t.id, 'emotion', { emotion_before: em.id, emotion_after: gv(t.id, 'emotion_after') ?? emotAfter })}
                                className={`text-base p-0.5 rounded transition-all hover:scale-125 ${(gv(t.id, 'emotion_before') ?? emotBefore) === em.id ? 'ring-2 ring-accent scale-110 rounded-full' : ''}`}>
                                {em.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Гарсны дараа</div>
                          <div className="flex flex-wrap gap-0.5">
                            {EMOTIONS.map((em) => (
                              <button key={em.id} title={em.label}
                                onClick={() => saveField(t.id, 'emotion', { emotion_before: gv(t.id, 'emotion_before') ?? emotBefore, emotion_after: em.id })}
                                className={`text-base p-0.5 rounded transition-all hover:scale-125 ${(gv(t.id, 'emotion_after') ?? emotAfter) === em.id ? 'ring-2 ring-accent scale-110 rounded-full' : ''}`}>
                                {em.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-1">
                          {emotBefore && <span className="text-lg" title={EMOTIONS.find(e => e.id === emotBefore)?.label}>{EMOTIONS.find(e => e.id === emotBefore)?.emoji}</span>}
                          {emotBefore && emotAfter && <span className="text-slate-700 text-xs">→</span>}
                          {emotAfter  && <span className="text-lg" title={EMOTIONS.find(e => e.id === emotAfter)?.label}>{EMOTIONS.find(e => e.id === emotAfter)?.emoji}</span>}
                          {!emotBefore && !emotAfter && <span className="text-slate-600">—</span>}
                        </div>
                        <FlashOverlay id={t.id} field="emotion" />
                      </>
                    )}
                  </td>

                  {/* ── MEDIA ────────────────────── */}
                  <td className={cellCls(t.id, 'media', 'text-center')} onClick={(e) => startEdit(e, t.id, 'media', null)}>
                    {isEdit(t.id, 'media') ? (
                      <div className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <label className="px-2 py-1.5 bg-accent/10 border border-accent/30 text-accent text-xs rounded-lg cursor-pointer hover:bg-accent/20 transition-colors flex items-center gap-1.5">
                          <Image className="w-3.5 h-3.5" /> Зураг оруулах
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => saveField(t.id, 'media', { screenshot_url: reader.result });
                              reader.readAsDataURL(file);
                            }} />
                        </label>
                        {t.screenshot_url && (
                          <button onClick={() => saveField(t.id, 'media', { screenshot_url: null })}
                            className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors">
                            Устгах
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${t.screenshot_url ? 'bg-accent/10 border border-accent/20 text-accent' : 'text-slate-700'}`} title={t.screenshot_url ? 'Screenshot байна' : 'Screenshot байхгүй'}>
                            <Image className="w-3.5 h-3.5" />
                          </div>
                          {(t.notes || t.why_entered || t.what_happened || t.lessons_learned) && (
                            <div className="w-7 h-7 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent" title="Тэмдэглэл байна">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <FlashOverlay id={t.id} field="media" />
                      </>
                    )}
                  </td>

                  {/* ── ACTIONS ──────────────────── */}
                  <td className="px-5 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === t.id ? null : t.id); }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openMenuId === t.id && (
                      <div ref={menuRef} className="absolute right-8 top-10 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1">
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onEdit(t); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                          <Edit2 className="w-4 h-4" /> Засах
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onDuplicate(t); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                          <Copy className="w-4 h-4" /> Хуулах
                        </button>
                        <div className="h-px bg-slate-700 my-1" />
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onDelete(t.id); }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Устгах
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* ── Accordion notes row ───────────────────────────────────── */}
                <tr key={`${t.id}-notes`}>
                  <td colSpan={11} className="p-0">
                    <div
                      style={{
                        maxHeight: isExpanded ? '320px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 300ms ease-in-out',
                      }}
                    >
                      <div className="px-8 py-5 bg-slate-800/30 border-b border-slate-800/50">
                        <div className="grid grid-cols-3 gap-5">
                          {NOTE_FIELDS.map(({ key, label, placeholder }) => (
                            <div key={key} className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {label}
                              </label>
                              <textarea
                                value={nv[key] ?? ''}
                                onChange={(e) =>
                                  setNoteVals(prev => ({
                                    ...prev,
                                    [t.id]: { ...prev[t.id], [key]: e.target.value },
                                  }))
                                }
                                placeholder={placeholder}
                                onClick={(e) => e.stopPropagation()}
                                rows={4}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 resize-none transition-colors"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-3">
                          {noteSaved === t.id && (
                            <div className="flex items-center gap-1.5 text-emerald-400 text-sm animate-fade-slide-in">
                              <CheckCircle2 className="w-4 h-4" />
                              Хадгалагдлаа
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); saveNotes(t.id); }}
                            className="px-4 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-sm font-medium rounded-lg transition-colors"
                          >
                            Хадгалах
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

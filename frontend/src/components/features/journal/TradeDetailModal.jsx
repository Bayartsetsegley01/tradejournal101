import { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownRight, Calendar, Clock, Check, Plus, Save, Image as ImageIcon, Copy, Trash2 } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS } from "@/lib/constants";
import { tradeService } from "@/services/tradeService";

export function TradeDetailModal({ trade, onClose, onEdit, onDuplicate, onDelete }) {
  const parseTags = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
    return [];
  };

  const [editData, setEditData] = useState({
    strategy: trade.strategy || '',
    positiveTags: parseTags(trade.positiveTags || trade.positive_tags),
    mistakeTags: parseTags(trade.mistakeTags || trade.mistake_tags),
    whyEntered: trade.whyEntered || trade.why_entered || '',
    whatHappened: trade.whatHappened || trade.what_happened || '',
    whatWentWell: trade.whatWentWell || trade.what_went_well || '',
    mistakesMade: trade.mistakesMade || trade.mistakes_made || '',
    lessonLearned: trade.lessonLearned || trade.lessons_learned || '',
    notes: trade.notes || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedOk, setSavedOk] = useState(false);

  const original = {
    strategy: trade.strategy || '',
    positiveTags: parseTags(trade.positiveTags || trade.positive_tags),
    mistakeTags: parseTags(trade.mistakeTags || trade.mistake_tags),
    whyEntered: trade.whyEntered || trade.why_entered || '',
    whatHappened: trade.whatHappened || trade.what_happened || '',
    whatWentWell: trade.whatWentWell || trade.what_went_well || '',
    mistakesMade: trade.mistakesMade || trade.mistakes_made || '',
    lessonLearned: trade.lessonLearned || trade.lessons_learned || '',
    notes: trade.notes || '',
  };

  const hasChanges =
    editData.strategy !== original.strategy ||
    editData.whyEntered !== original.whyEntered ||
    editData.whatHappened !== original.whatHappened ||
    editData.whatWentWell !== original.whatWentWell ||
    editData.mistakesMade !== original.mistakesMade ||
    editData.lessonLearned !== original.lessonLearned ||
    editData.notes !== original.notes ||
    JSON.stringify(editData.positiveTags) !== JSON.stringify(original.positiveTags) ||
    JSON.stringify(editData.mistakeTags) !== JSON.stringify(original.mistakeTags);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await tradeService.updateTrade(trade.id, {
        strategy: editData.strategy,
        positive_tags: editData.positiveTags,
        mistake_tags: editData.mistakeTags,
        why_entered: editData.whyEntered,
        what_happened: editData.whatHappened,
        what_went_well: editData.whatWentWell,
        mistakes_made: editData.mistakesMade,
        lessons_learned: editData.lessonLearned,
        notes: editData.notes,
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } catch (err) {
      setSaveError(err.message || "Хадгалахад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (type, tagId) => {
    setEditData(prev => {
      const tags = prev[type];
      if (tags.includes(tagId)) return { ...prev, [type]: tags.filter(t => t !== tagId) };
      return { ...prev, [type]: [...tags, tagId] };
    });
  };

  const getEmotion = (id) => EMOTIONS.find(e => e.id === id);
  const eb = trade.emotionBefore || trade.emotion_before || null;
  const ea = trade.emotionAfter  || trade.emotion_after  || null;

  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5";
  const textareaCls = "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-600 resize-none transition-all placeholder-slate-700";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full max-w-[460px] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {trade.direction === 'LONG' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{trade.symbol}</h2>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">{trade.market_type || trade.market}</span>
                {trade.is_draft && <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-800 px-1.5 py-0.5 rounded">Draft</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{safeFormatDate(trade.entry_date || trade.date, "MMM dd, yyyy")}</span>
                {trade.session && <span className="flex items-center gap-1 capitalize"><Clock className="w-3 h-3" />{trade.session}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onDuplicate} className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors" title="Хуулах">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-colors" title="Устгах">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Status + Direction badges */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-800/60">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              trade.status === 'CLOSED'
                ? (trade.pnl > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                 : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                : trade.status === 'DRAFT'
                ? 'bg-slate-700/50 text-slate-400 border border-slate-600'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {trade.status === 'CLOSED' ? (trade.pnl > 0 ? '✓ Ашигтай' : '✗ Алдагдалтай')
               : trade.status === 'DRAFT' ? '○ Ноорог' : '● Нээлттэй'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>{trade.direction}</span>
          </div>

          {/* Stats grid */}
          <div className="px-5 py-4 border-b border-slate-800/60">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Entry', value: trade.entry_price || trade.entry || '—', cls: 'text-white' },
                { label: 'Exit', value: trade.exit_price || trade.exit || '—', cls: 'text-white' },
                { label: 'R/R', value: (trade.rr_ratio || trade.rr) ? `${trade.rr_ratio || trade.rr}R` : '—', cls: 'text-white' },
                {
                  label: 'P&L',
                  value: trade.pnl != null ? `${trade.pnl > 0 ? '+' : ''}$${trade.pnl}` : '—',
                  cls: isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-white',
                  highlight: isWin ? 'border-emerald-500/30 bg-emerald-500/5' : isLoss ? 'border-rose-500/30 bg-rose-500/5' : '',
                },
              ].map((item, i) => (
                <div key={i} className={`bg-slate-950 border border-slate-800 rounded-xl p-3 ${item.highlight || ''}`}>
                  <div className="text-[10px] text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-xs font-mono font-bold ${item.cls}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* SL / TP / Position */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 mb-1">Stop Loss</div>
                <div className="text-xs font-mono text-rose-400">{trade.stop_loss || '—'}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 mb-1">Take Profit</div>
                <div className="text-xs font-mono text-emerald-400">{trade.take_profit || '—'}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 mb-1">Lot / Qty</div>
                <div className="text-xs font-mono text-white">{trade.position_size || '—'}</div>
              </div>
            </div>
          </div>

          {/* Strategy (editable) */}
          <div className="px-5 py-4 border-b border-slate-800/60">
            <label className={labelCls}>Стратеги</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600 transition-all"
              placeholder="e.g. ICT, SMC, Breakout..."
              value={editData.strategy}
              onChange={e => setEditData(prev => ({ ...prev, strategy: e.target.value }))}
            />
          </div>

          {/* Emotions */}
          {(eb || ea) && (
            <div className="px-5 py-4 border-b border-slate-800/60">
              <label className={labelCls}>Сэтгэл зүй</label>
              <div className="flex gap-2 flex-wrap">
                {eb && (
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300">
                    {getEmotion(eb)?.emoji || '😐'} {getEmotion(eb)?.label || eb} <span className="text-slate-500">(өмнө)</span>
                  </span>
                )}
                {ea && (
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300">
                    {getEmotion(ea)?.emoji || '😐'} {getEmotion(ea)?.label || ea} <span className="text-slate-500">(дараа)</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Positive Tags (editable) */}
          <div className="px-5 py-4 border-b border-slate-800/60">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">
              <Check className="w-3 h-3" /> Давуу тал
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POSITIVE_TAGS.map(t => (
                <button key={t.id} onClick={() => toggleTag('positiveTags', t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    editData.positiveTags.includes(t.id)
                      ? 'bg-accent/10 border-accent/50 text-accent'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Mistake Tags (editable) */}
          <div className="px-5 py-4 border-b border-slate-800/60">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">
              <X className="w-3 h-3" /> Алдаа
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_TAGS.map(t => (
                <button key={t.id} onClick={() => toggleTag('mistakeTags', t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    editData.mistakeTags.includes(t.id)
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Journal notes (editable) */}
          <div className="px-5 py-4 border-b border-slate-800/60 space-y-4">
            <label className={labelCls}>Тэмдэглэл</label>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Яагаад орсон бэ?</p>
              <textarea rows={2} className={textareaCls} placeholder="Setup, шалтгаан..."
                value={editData.whyEntered} onChange={e => setEditData(p => ({ ...p, whyEntered: e.target.value }))} />
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Юу болсон бэ?</p>
              <textarea rows={2} className={textareaCls} placeholder=""
                value={editData.whatHappened} onChange={e => setEditData(p => ({ ...p, whatHappened: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-600 mb-1">Юуг сайн хийсэн?</p>
                <textarea rows={2} className={textareaCls}
                  value={editData.whatWentWell} onChange={e => setEditData(p => ({ ...p, whatWentWell: e.target.value }))} />
              </div>
              <div>
                <p className="text-[10px] text-slate-600 mb-1">Ямар алдаа?</p>
                <textarea rows={2} className={textareaCls}
                  value={editData.mistakesMade} onChange={e => setEditData(p => ({ ...p, mistakesMade: e.target.value }))} />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Юу сурсан бэ?</p>
              <textarea rows={2} className={textareaCls} placeholder="Сургамж..."
                value={editData.lessonLearned} onChange={e => setEditData(p => ({ ...p, lessonLearned: e.target.value }))} />
            </div>
          </div>

          {/* Screenshot */}
          <div className="px-5 py-4">
            <label className={labelCls}>Screenshot</label>
            <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center text-slate-600 relative group cursor-pointer bg-slate-950">
              {trade.screenshot_url ? (
                <>
                  <img src={trade.screenshot_url} alt="Trade Screenshot" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={trade.screenshot_url} target="_blank" rel="noreferrer"
                      className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">
                      Томруулж харах
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon className="w-7 h-7 mb-1.5 opacity-30" />
                  <span className="text-xs text-slate-700 absolute bottom-4">Зураг оруулаагүй</span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Save footer — shows when there are changes */}
        {hasChanges && (
          <div className="px-5 py-3 border-t border-slate-800 shrink-0 space-y-2">
            {saveError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-2.5 rounded-xl">{saveError}</div>
            )}
            <button onClick={handleSave} disabled={isSaving}
              className="w-full bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving
                ? <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                : savedOk
                ? <><Check className="w-4 h-4" /> Хадгалагдлаа!</>
                : <><Save className="w-4 h-4" /> Өөрчлөлт хадгалах</>
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { X, ArrowUpRight, ArrowDownRight, Calendar, Clock, Check, Save, Camera, Loader2, Copy, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { safeFormatDate } from "@/lib/utils";
import { EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS, SESSIONS } from "@/lib/constants";
import { tradeService } from "@/services/tradeService";

export function TradeDetailModal({ trade, onClose, onEdit, onDuplicate, onDelete, onSaved }) {
  const parseTags = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
    return [];
  };

  const [editData, setEditData] = useState({
    strategy:      trade.strategy || '',
    session:       trade.session  || '',
    emotion_before: trade.emotionBefore || trade.emotion_before || '',
    emotion_after:  trade.emotionAfter  || trade.emotion_after  || '',
    pnl:           trade.pnl != null ? String(trade.pnl) : '',
    positiveTags:  parseTags(trade.positiveTags || trade.positive_tags),
    mistakeTags:   parseTags(trade.mistakeTags  || trade.mistake_tags),
    whyEntered:    trade.whyEntered    || trade.why_entered    || '',
    whatHappened:  trade.whatHappened  || trade.what_happened  || '',
    whatWentWell:  trade.whatWentWell  || trade.what_went_well || '',
    mistakesMade:  trade.mistakesMade  || trade.mistakes_made  || '',
    lessonLearned: trade.lessonLearned || trade.lessons_learned || '',
    notes:         trade.notes || '',
  });

  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedOk, setSavedOk]     = useState(false);

  // Media state (separate from save — uploads immediately)
  const [mediaUrls, setMediaUrls] = useState(
    Array.isArray(trade.media_urls) ? trade.media_urls :
    Array.isArray(trade.mediaUrls)  ? trade.mediaUrls  : []
  );
  const [uploading, setUploading]   = useState(false);
  const [lightbox, setLightbox]     = useState(null);
  const fileInputRef                = useRef(null);

  const handleUpload = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    if (mediaUrls.length >= 3) return;
    setUploading(true);
    try {
      const res = await tradeService.uploadMedia(trade.id, file);
      setMediaUrls(res.data.media_urls);
      onSaved?.();
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = async (url) => {
    try {
      const res = await tradeService.removeMedia(trade.id, url);
      setMediaUrls(res.data.media_urls || []);
      onSaved?.();
    } catch (e) {
      console.error('Remove failed', e);
    }
  };

  const original = {
    strategy:      trade.strategy || '',
    session:       trade.session  || '',
    emotion_before: trade.emotionBefore || trade.emotion_before || '',
    emotion_after:  trade.emotionAfter  || trade.emotion_after  || '',
    pnl:           trade.pnl != null ? String(trade.pnl) : '',
    positiveTags:  parseTags(trade.positiveTags || trade.positive_tags),
    mistakeTags:   parseTags(trade.mistakeTags  || trade.mistake_tags),
    whyEntered:    trade.whyEntered    || trade.why_entered    || '',
    whatHappened:  trade.whatHappened  || trade.what_happened  || '',
    whatWentWell:  trade.whatWentWell  || trade.what_went_well || '',
    mistakesMade:  trade.mistakesMade  || trade.mistakes_made  || '',
    lessonLearned: trade.lessonLearned || trade.lessons_learned || '',
    notes:         trade.notes || '',
  };

  const hasChanges =
    editData.strategy      !== original.strategy      ||
    editData.session       !== original.session       ||
    editData.emotion_before !== original.emotion_before ||
    editData.emotion_after  !== original.emotion_after  ||
    editData.pnl           !== original.pnl           ||
    editData.whyEntered    !== original.whyEntered    ||
    editData.whatHappened  !== original.whatHappened  ||
    editData.lessonLearned !== original.lessonLearned ||
    editData.notes         !== original.notes         ||
    JSON.stringify(editData.positiveTags) !== JSON.stringify(original.positiveTags) ||
    JSON.stringify(editData.mistakeTags)  !== JSON.stringify(original.mistakeTags);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await tradeService.updateTrade(trade.id, {
        // Preserve all original fields so the full UPDATE doesn't null them out
        status:        trade.status || 'CLOSED',
        symbol:        trade.symbol,
        market_type:   trade.market_type,
        direction:     trade.direction,
        entry_date:    trade.entry_date,
        exit_date:     trade.exit_date,
        entry_price:   trade.entry_price,
        exit_price:    trade.exit_price,
        stop_loss:     trade.stop_loss,
        take_profit:   trade.take_profit,
        position_size: trade.position_size,
        rr_ratio:      trade.rr_ratio,
        risk_percent:  trade.risk_percent != null ? trade.risk_percent : trade.riskPercent,
        screenshot_url: trade.screenshot_url,
        // User-editable fields
        strategy:      editData.strategy      || null,
        session:       editData.session       || null,
        emotion_before: editData.emotion_before || null,
        emotion_after:  editData.emotion_after  || null,
        pnl:           editData.pnl !== '' ? parseFloat(editData.pnl) : trade.pnl,
        positive_tags: editData.positiveTags,
        mistake_tags:  editData.mistakeTags,
        why_entered:   editData.whyEntered    || null,
        what_happened: editData.whatHappened  || null,
        what_went_well: editData.whatWentWell  || null,
        mistakes_made: editData.mistakesMade  || null,
        lessons_learned: editData.lessonLearned || null,
        notes:         editData.notes         || null,
      });
      setSavedOk(true);
      onSaved?.();
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

          {/* Strategy + Session (editable) */}
          <div className="px-5 py-4 border-b border-slate-800/60 space-y-3">
            <div>
              <label className={labelCls}>Стратеги</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600 transition-all"
                placeholder="e.g. ICT, SMC, Breakout..."
                value={editData.strategy}
                onChange={e => setEditData(prev => ({ ...prev, strategy: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Trading Session</label>
                <select
                  value={editData.session}
                  onChange={e => setEditData(prev => ({ ...prev, session: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600 transition-all"
                >
                  <option value="">— сонгох —</option>
                  {SESSIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Est. P&amp;L ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600 transition-all"
                  placeholder="0.00"
                  value={editData.pnl}
                  onChange={e => setEditData(prev => ({ ...prev, pnl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Emotions (editable) */}
          <div className="px-5 py-4 border-b border-slate-800/60">
            <label className={labelCls}>Сэтгэл зүй</label>
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] text-slate-600 mb-1.5">Арилжааны өмнө</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map(e => (
                    <button key={e.id}
                      onClick={() => setEditData(p => ({ ...p, emotion_before: p.emotion_before === e.id ? '' : e.id }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        editData.emotion_before === e.id
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                      }`}>{e.emoji} {e.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-600 mb-1.5">Арилжааны дараа</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map(e => (
                    <button key={e.id}
                      onClick={() => setEditData(p => ({ ...p, emotion_after: p.emotion_after === e.id ? '' : e.id }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        editData.emotion_after === e.id
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                      }`}>{e.emoji} {e.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
          <div className="px-5 py-4 border-b border-slate-800/60 space-y-3">
            <label className={labelCls}>Тэмдэглэл</label>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Яагаад орсон бэ?</p>
              <textarea rows={2} className={textareaCls} placeholder="Setup, шалтгаан..."
                value={editData.whyEntered} onChange={e => setEditData(p => ({ ...p, whyEntered: e.target.value }))} />
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Юу болсон бэ?</p>
              <textarea rows={2} className={textareaCls} placeholder="Зах зээл хэрхэн хөдөлсөн..."
                value={editData.whatHappened} onChange={e => setEditData(p => ({ ...p, whatHappened: e.target.value }))} />
            </div>
            <div>
              <p className="text-[10px] text-slate-600 mb-1">Юу сурсан бэ?</p>
              <textarea rows={2} className={textareaCls} placeholder="Сургамж..."
                value={editData.lessonLearned} onChange={e => setEditData(p => ({ ...p, lessonLearned: e.target.value }))} />
            </div>
          </div>

          {/* Screenshots / Media */}
          <div className="px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Зурагнууд ({mediaUrls.length}/3)</label>
              {mediaUrls.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:text-accent/80 transition-colors disabled:opacity-40"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  {uploading ? 'Байршуулж байна...' : 'Зураг нэмэх'}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) { handleUpload(f); e.target.value = ''; } }}
            />
            {mediaUrls.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
                className="border-2 border-dashed border-slate-800 rounded-xl h-24 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-slate-600 hover:bg-slate-800/20 transition-all"
              >
                <Camera className="w-6 h-6 text-slate-600" />
                <span className="text-xs text-slate-600">Зураг чирж хийх эсвэл дарах</span>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative group/img w-[80px] h-[60px]">
                    <img
                      src={url} alt=""
                      className="w-full h-full object-cover rounded-lg border border-slate-700 cursor-zoom-in hover:border-slate-500 transition-colors"
                      onClick={() => setLightbox(url)}
                    />
                    <button
                      onClick={() => handleRemoveMedia(url)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 hover:bg-rose-400 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {mediaUrls.length < 3 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[80px] h-[60px] border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/30 transition-all"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : <Camera className="w-4 h-4 text-slate-600" />}
                  </div>
                )}
              </div>
            )}
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

    {/* Lightbox */}
    {lightbox && createPortal(
      <div
        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setLightbox(null)}
      >
        <img
          src={lightbox} alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={() => setLightbox(null)}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>,
      document.body
    )}
  );
}

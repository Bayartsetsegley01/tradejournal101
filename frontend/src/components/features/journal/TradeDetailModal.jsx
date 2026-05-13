import { X, ArrowUpRight, ArrowDownRight, Calendar, Clock, Target, Image as ImageIcon, Edit2, Copy, Trash2, Download } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS } from "@/lib/constants";

export function TradeDetailModal({ trade, onClose, onEdit, onDuplicate, onDelete }) {
  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  const getEmotion = (id) => EMOTIONS.find(e => e.id === id);
  const getPositiveTag = (id) => POSITIVE_TAGS.find(t => t.id === id);
  const getMistakeTag = (id) => MISTAKE_TAGS.find(t => t.id === id);

  const eb = trade.emotionBefore || trade.emotion_before || null;
  const ea = trade.emotionAfter  || trade.emotion_after  || null;

  const parseTags = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return []; }
    }
    return [];
  };

  const posTags  = parseTags(trade.positiveTags || trade.positive_tags);
  const misTags  = parseTags(trade.mistakeTags  || trade.mistake_tags);
  const whyText  = trade.whyEntered    || trade.why_entered    || '';
  const whatText = trade.whatHappened  || trade.what_happened  || '';
  const wellText = trade.whatWentWell  || trade.what_went_well || '';
  const mistText = trade.mistakesMade  || trade.mistakes_made  || '';
  const lessonText = trade.lessonLearned || trade.lessons_learned || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Slide-over panel */}
      <div className="relative w-full sm:w-[600px] h-full bg-slate-900 sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l sm:border border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {trade.direction === 'LONG' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {trade.symbol}
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded uppercase">
                {trade.market_type || trade.market}
                </span>
                {trade.is_draft && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded ml-2">
                    Draft
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {safeFormatDate(trade.entry_date || trade.date, "MMM dd, yyyy")}</span>
                {trade.session && <span className="flex items-center gap-1 capitalize"><Clock className="w-3 h-3" /> {trade.session}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-slate-400 hover:text-white transition-colors bg-slate-950 p-2 rounded-lg border border-slate-800" title="Засах">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDuplicate} className="text-slate-400 hover:text-white transition-colors bg-slate-950 p-2 rounded-lg border border-slate-800" title="Хуулах">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 p-2 rounded-lg border border-rose-500/20" title="Устгах">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-950 p-2 rounded-lg border border-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">

          {/* STATUS badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
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
            {trade.strategy && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {trade.strategy}
              </span>
            )}
            {trade.direction && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                trade.direction === 'LONG' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {trade.direction}
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">Entry</div>
              <div className="text-sm font-mono text-white">{trade.entry_price || trade.entry || '-'}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">Exit</div>
              <div className="text-sm font-mono text-white">{trade.exit_price || trade.exit || '-'}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">R/R</div>
              <div className="text-sm font-mono text-white">{(trade.rr_ratio || trade.rr) ? `${trade.rr_ratio || trade.rr}R` : '-'}</div>
            </div>
            <div className={`bg-slate-950 border border-slate-800 rounded-xl p-4 ${
              isWin ? 'border-emerald-500/30 bg-emerald-500/5' : isLoss ? 'border-rose-500/30 bg-rose-500/5' : ''
            }`}>
              <div className="text-xs text-slate-500 mb-1">P&L</div>
              <div className={`text-sm font-mono font-bold ${
                isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-white'
              }`}>
                {trade.pnl > 0 ? '+' : ''}${trade.pnl}
              </div>
            </div>
          </div>

          {/* Psychology & Tags */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              Сэтгэл зүй & Үнэлгээ
            </h3>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-400 w-24">Сэтгэл зүй:</div>
                <div className="flex gap-2 flex-wrap">
                  {eb ? (
                    <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-sm text-slate-300">
                      {getEmotion(eb)?.emoji || '😐'} {getEmotion(eb)?.label || eb} (өмнө)
                    </span>
                  ) : null}
                  {ea ? (
                    <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-sm text-slate-300">
                      {getEmotion(ea)?.emoji || '😐'} {getEmotion(ea)?.label || ea} (дараа)
                    </span>
                  ) : null}
                  {!eb && !ea && (
                    <span className="text-slate-600 text-sm">Бүртгэгдээгүй</span>
                  )}
                </div>
              </div>

              {posTags.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="text-sm text-slate-400 w-24 mt-1">Давуу тал:</div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {posTags.map(id => (
                      <span key={id} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                        {getPositiveTag(id)?.label || id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {misTags.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="text-sm text-slate-400 w-24 mt-1">Алдаа:</div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {misTags.map(id => (
                      <span key={id} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs font-medium">
                        {getMistakeTag(id)?.label || id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Тэмдэглэл</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-2">Яагаад орсон бэ? (Setup)</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {whyText || trade.notes || '-'}
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-500 mb-2">Юу болсон бэ?</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {whatText || '-'}
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-500 mb-2">Юу сайн хийсэн бэ?</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {wellText || '-'}
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-500 mb-2">Ямар алдаа гаргасан бэ?</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {mistText || '-'}
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-500 mb-2">Юу сурсан бэ?</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {lessonText || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Screenshot</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl aspect-video flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group cursor-pointer">
              {trade.screenshot_url ? (
                <>
                  <img src={trade.screenshot_url} alt="Trade Screenshot" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={trade.screenshot_url} target="_blank" rel="noreferrer" className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">Томруулж харах</a>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Зураг оруулаагүй байна</span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import { X, ArrowUpRight, ArrowDownRight, Calendar, Clock, Target, Image as ImageIcon, Edit2, Copy, Trash2, Download } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { EMOTIONS, POSITIVE_TAGS, MISTAKE_TAGS } from "@/lib/constants";

export function TradeDetailModal({ trade, onClose, onEdit, onDuplicate, onDelete }) {
  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  const getEmotion = (id) => EMOTIONS.find(e => e.id === id);
  const getPositiveTag = (id) => POSITIVE_TAGS.find(t => t.id === id);
  const getMistakeTag = (id) => MISTAKE_TAGS.find(t => t.id === id);

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
                <div className="flex gap-2">
                  {trade.emotionBefore && (
                    <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-sm text-slate-300">
                      {getEmotion(trade.emotionBefore)?.emoji} Өмнө
                    </span>
                  )}
                  {trade.emotionAfter && (
                    <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-sm text-slate-300">
                      {getEmotion(trade.emotionAfter)?.emoji} Дараа
                    </span>
                  )}
                </div>
              </div>

              {trade.positiveTags?.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="text-sm text-slate-400 w-24 mt-1">Давуу тал:</div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {trade.positiveTags.map(id => (
                      <span key={id} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                        {getPositiveTag(id)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {trade.mistakeTags?.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="text-sm text-slate-400 w-24 mt-1">Алдаа:</div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {trade.mistakeTags.map(id => (
                      <span key={id} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs font-medium">
                        {getMistakeTag(id)?.label}
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
                  {trade.whyEntered || trade.notes || '-'}
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-500 mb-2">Юу болсон бэ?</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {trade.whatHappened || '-'}
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <div className="text-xs text-slate-500 mb-2">Юу сурсан бэ?</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {trade.lessonLearned || trade.lessons_learned || '-'}
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

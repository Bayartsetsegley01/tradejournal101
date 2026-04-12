import { X, ArrowUpRight, ArrowDownRight, Calendar, Clock, Target, Image as ImageIcon, Edit2, Copy, Trash2 } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

export function TradeDetailModal({ trade, onClose, onEdit, onDuplicate, onDelete }) {
  const { t } = useLang();
  const isWin = parseFloat(trade.pnl) > 0;
  const isLoss = parseFloat(trade.pnl) < 0;

  // Tags may be label strings (from DB) or IDs (from constants)
  const renderTags = (tags, colorClass) => {
    if (!tags || tags.length === 0) return null;
    return tags.map((tag, i) => (
      <span key={i} className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
        {tag}
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

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
              </h2>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {safeFormatDate(trade.entry_date || trade.date, "MMM dd, yyyy")}
                </span>
                {trade.session && (
                  <span className="flex items-center gap-1 capitalize">
                    <Clock className="w-3 h-3" /> {trade.session}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-slate-400 hover:text-white bg-slate-950 p-2 rounded-lg border border-slate-800">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDuplicate} className="text-slate-400 hover:text-white bg-slate-950 p-2 rounded-lg border border-slate-800">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-rose-400 hover:text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-950 p-2 rounded-lg border border-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('entryPrice'), value: trade.entry_price || trade.entry || '-' },
              { label: t('exitPrice'), value: trade.exit_price || trade.exit || '-' },
              { label: 'R/R', value: (trade.rr_ratio || trade.rr) ? `${trade.rr_ratio || trade.rr}R` : '-' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className="text-sm font-mono text-white">{s.value}</div>
              </div>
            ))}
            <div className={`bg-slate-950 border border-slate-800 rounded-xl p-4 ${
              isWin ? 'border-emerald-500/30 bg-emerald-500/5' : isLoss ? 'border-rose-500/30 bg-rose-500/5' : ''
            }`}>
              <div className="text-xs text-slate-500 mb-1">P&L</div>
              <div className={`text-sm font-mono font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-white'}`}>
                {parseFloat(trade.pnl) > 0 ? '+' : ''}{trade.pnl}
              </div>
            </div>
          </div>

          {/* Extra info */}
          {(trade.stop_loss || trade.stopLoss || trade.take_profit || trade.takeProfit || trade.position_size || trade.quantity || trade.strategy) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(trade.stop_loss || trade.stopLoss) && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{t('stopLoss')}</div>
                  <div className="text-sm font-mono text-rose-400">{trade.stop_loss || trade.stopLoss}</div>
                </div>
              )}
              {(trade.take_profit || trade.takeProfit) && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{t('takeProfit')}</div>
                  <div className="text-sm font-mono text-emerald-400">{trade.take_profit || trade.takeProfit}</div>
                </div>
              )}
              {(trade.position_size || trade.quantity) && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{t('quantity')}</div>
                  <div className="text-sm font-mono text-white">{trade.position_size || trade.quantity}</div>
                </div>
              )}
              {trade.strategy && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{t('strategy')}</div>
                  <div className="text-sm text-white">{trade.strategy}</div>
                </div>
              )}
            </div>
          )}

          {/* Psychology & Tags */}
          {(trade.emotionBefore || trade.emotionAfter || trade.emotion_before || trade.emotion_after ||
            (trade.positiveTags?.length > 0) || (trade.mistakeTags?.length > 0)) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                {t('psychologyTags')}
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">

                {(trade.emotionBefore || trade.emotion_before || trade.emotionAfter || trade.emotion_after) && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400 w-24 shrink-0">{t('psychology')}:</div>
                    <div className="flex gap-2 flex-wrap">
                      {(trade.emotionBefore || trade.emotion_before) && (
                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-sm">
                          😌 {trade.emotionBefore || trade.emotion_before}
                        </span>
                      )}
                      {(trade.emotionBefore || trade.emotion_before) && (trade.emotionAfter || trade.emotion_after) && (
                        <span className="text-slate-600 text-sm self-center">→</span>
                      )}
                      {(trade.emotionAfter || trade.emotion_after) && (
                        <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-sm">
                          {trade.emotionAfter || trade.emotion_after}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {trade.positiveTags?.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="text-sm text-slate-400 w-24 mt-1 shrink-0">{t('positiveTags')}:</div>
                    <div className="flex flex-wrap gap-2">
                      {renderTags(trade.positiveTags, 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')}
                    </div>
                  </div>
                )}

                {trade.mistakeTags?.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="text-sm text-slate-400 w-24 mt-1 shrink-0">{t('mistakeTags')}:</div>
                    <div className="flex flex-wrap gap-2">
                      {renderTags(trade.mistakeTags, 'bg-rose-500/10 border-rose-500/20 text-rose-400')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes / Journal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Тэмдэглэл</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              {[
                { label: t('whyEntered'), value: trade.whyEntered || trade.why_entered || trade.notes },
                { label: t('whatHappened'), value: trade.whatHappened || trade.what_happened },
                { label: t('whatWentWell'), value: trade.whatWentWell || trade.what_went_well },
                { label: t('mistakesMade'), value: trade.mistakesMade || trade.mistakes_made },
                { label: t('lessonLearned'), value: trade.lessonLearned || trade.lessons_learned },
              ].filter(item => item.value).map((item, i, arr) => (
                <div key={i}>
                  <div className="text-xs text-slate-500 mb-2">{item.label}</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.value}</p>
                  {i < arr.length - 1 && <div className="h-px bg-slate-800 mt-4" />}
                </div>
              ))}
              {!trade.whyEntered && !trade.why_entered && !trade.notes &&
               !trade.whatHappened && !trade.what_happened &&
               !trade.lessonLearned && !trade.lessons_learned && (
                <p className="text-sm text-slate-600">Тэмдэглэл байхгүй.</p>
              )}
            </div>
          </div>

          {/* Screenshot */}
          {trade.screenshot_url && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Screenshot
              </h3>
              <div className="rounded-2xl overflow-hidden border border-slate-700">
                <img src={trade.screenshot_url} alt="Trade Screenshot" className="w-full h-auto max-h-[300px] object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

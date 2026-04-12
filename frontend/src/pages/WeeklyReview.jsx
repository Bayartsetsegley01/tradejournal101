import { useLang } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { CalendarDays, TrendingUp, TrendingDown, Target, Brain, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { analyticsService } from "@/services/analyticsService";

function getWeekRange(offset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(offset = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1 + offset;
  const adjustedYear = year + Math.floor((month - 1) / 12);
  const adjustedMonth = ((month - 1 + 120) % 12) + 1;
  return { year: adjustedYear, month: adjustedMonth };
}

const MONTH_NAMES = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
  '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];

export function WeeklyReviewPage() {
  const { t } = useLang();
  const [mode, setMode] = useState('weekly'); // 'weekly' | 'monthly'
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setData(null);
      try {
        let res;
        if (mode === 'weekly') {
          const { start, end } = getWeekRange(weekOffset);
          res = await analyticsService.getWeeklyReview(start.toISOString(), end.toISOString());
        } else {
          const { year, month } = getMonthRange(monthOffset);
          res = await analyticsService.getMonthlyReview(year, month);
        }
        if (res.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode, weekOffset, monthOffset]);

  const weekRange = getWeekRange(weekOffset);
  const monthInfo = getMonthRange(monthOffset);

  const fmtDate = (d) => new Date(d).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
  const fmtPnl = (v) => (v >= 0 ? '+' : '') + v?.toFixed(2);

  const periodLabel = mode === 'weekly'
    ? `${fmtDate(weekRange.start)} – ${fmtDate(weekRange.end)}`
    : `${monthInfo.year} / ${MONTH_NAMES[monthInfo.month - 1]}`;

  return (
    <div className="p-8 max-w-[1100px] mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-accent" />
            {mode === 'weekly' ? t('weeklyTitle') : t('monthlyTitle')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Арилжааны гүйцэтгэлийн автомат тайлан</p>
        </div>
        {/* Mode toggle */}
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          <button onClick={() => setMode('weekly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode==='weekly' ? 'bg-accent text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            7 хоног
          </button>
          <button onClick={() => setMode('monthly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode==='monthly' ? 'bg-accent text-slate-950' : 'text-slate-400 hover:text-white'}`}>
            Сар
          </button>
        </div>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => mode === 'weekly' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-base min-w-[200px] text-center">{periodLabel}</span>
        <button
          onClick={() => mode === 'weekly' ? setWeekOffset(o => Math.min(o + 1, 0)) : setMonthOffset(o => Math.min(o + 1, 0))}
          disabled={(mode === 'weekly' && weekOffset >= 0) || (mode === 'monthly' && monthOffset >= 0)}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : !data ? null : data.totalTrades === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t('noTradesInPeriod')}</p>
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
            <p className="text-slate-200 text-sm leading-relaxed">{data.summary}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('totalTrades'), value: data.totalTrades, color: 'text-white' },
              { label: t('winRate'), value: data.winRate + '%', color: data.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400' },
              { label: t('netPnl'), value: fmtPnl(data.netPnl), color: data.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
              { label: t('profitFactor'), value: data.profitFactor || '—', color: data.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400' },
              { label: t('avgWin'), value: fmtPnl(data.avgWin), color: 'text-emerald-400' },
              { label: t('avgLoss'), value: '-' + data.avgLoss?.toFixed(2), color: 'text-rose-400' },
              { label: t('avgRR'), value: data.avgRR ? data.avgRR + 'R' : '—', color: 'text-accent' },
              { label: 'Ялагч / Ялагдагч', value: `${data.winningTrades} / ${data.losingTrades}`, color: 'text-slate-300' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Best / Worst trade */}
          {(data.bestTrade || data.worstTrade) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.bestTrade && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">{t('bestTrade')}</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{fmtPnl(parseFloat(data.bestTrade.pnl))}</p>
                  <p className="text-xs text-slate-400 mt-1">{data.bestTrade.symbol} · {data.bestTrade.direction}</p>
                </div>
              )}
              {data.worstTrade && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-semibold text-white">{t('worstTrade')}</span>
                  </div>
                  <p className="text-lg font-bold text-rose-400">{fmtPnl(parseFloat(data.worstTrade.pnl))}</p>
                  <p className="text-xs text-slate-400 mt-1">{data.worstTrade.symbol} · {data.worstTrade.direction}</p>
                </div>
              )}
            </div>
          )}

          {/* Tags + Emotions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.topMistakeTags.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-400" /> {t('topMistakes')}
                </h3>
                <ul className="space-y-2">
                  {data.topMistakeTags.map((t, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">{t.tag}</span>
                      <span className="text-rose-400 font-semibold">{t.count}x</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.topPositiveTags.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Давуу талууд
                </h3>
                <ul className="space-y-2">
                  {data.topPositiveTags.map((t, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">{t.tag}</span>
                      <span className="text-emerald-400 font-semibold">{t.count}x</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Emotion performance */}
          {Object.keys(data.emotionStats).length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent" /> {t('emotionEffect')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(data.emotionStats).map(([emotion, stats]) => (
                  <div key={emotion} className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{emotion}</p>
                    <p className="text-xs text-slate-500">{stats.count} арилжаа</p>
                    <p className={`text-sm font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fmtPnl(stats.totalPnl)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily breakdown */}
          {data.dailyBreakdown.length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('dailyBreakdown')}</h3>
              <div className="space-y-2">
                {data.dailyBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 w-24 shrink-0">{new Date(d.date).toLocaleDateString('mn-MN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${d.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(Math.abs(d.pnl) / (Math.max(...data.dailyBreakdown.map(x => Math.abs(x.pnl))) || 1) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`w-20 text-right font-semibold shrink-0 ${d.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtPnl(d.pnl)}</span>
                    <span className="text-slate-500 text-xs w-16 text-right">{d.trades} арилжаа</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
